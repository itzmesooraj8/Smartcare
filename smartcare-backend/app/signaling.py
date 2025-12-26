import json
import asyncio
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # map room_id -> list of peer_id (active participants / hosts)
        self.rooms: dict[str, list[str]] = {}
        # map (room_id, peer_id) -> WebSocket
        self.sockets: dict[tuple[str, str], WebSocket] = {}
        # pending join requests: (room_id, peer_id) -> WebSocket
        self.pending: dict[tuple[str, str], WebSocket] = {}
        # roles: (room_id, peer_id) -> 'host' | 'patient'
        self.roles: dict[tuple[str, str], str] = {}
        self.redis = None
        if getattr(settings, "REDIS_URL", None):
            try:
                self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                self.redis = None

    async def connect(self, websocket: WebSocket, room_id: str, peer_id: str):
        # Accept and register socket but DO NOT add patient to active room until approved
        await websocket.accept()
        self.sockets[(room_id, peer_id)] = websocket

    def disconnect(self, websocket: WebSocket, room_id: str, peer_id: str):
        # remove from sockets, pending, roles and rooms
        self.sockets.pop((room_id, peer_id), None)
        self.pending.pop((room_id, peer_id), None)
        self.roles.pop((room_id, peer_id), None)
        peer_list = self.rooms.get(room_id) or []
        try:
            if peer_id in peer_list:
                peer_list.remove(peer_id)
        except ValueError:
            pass
        if not peer_list:
            self.rooms.pop(room_id, None)

    async def _broadcast_to_room(self, room_id: str, message: str):
        peer_ids = list(self.rooms.get(room_id, []))
        for pid in peer_ids:
            ws = self.sockets.get((room_id, pid))
            if not ws:
                continue
            try:
                await ws.send_text(message)
            except Exception:
                # on failure, clean up
                self.disconnect(ws, room_id, pid)

    async def publish(self, room_id: str, message: str):
        # When Redis is configured, publish so other instances receive the message
        if self.redis:
            try:
                await self.redis.publish(f"room:{room_id}", message)
                return
            except Exception:
                # fall back to local broadcast
                pass
        await self._broadcast_to_room(room_id, message)

    async def start_redis_listener(self):
        if not self.redis:
            return
        pubsub = self.redis.pubsub()
        # Subscribe to all room channels
        await pubsub.psubscribe("room:*")

        async def _listener():
            # Use event-driven pubsub listen() iterator instead of polling
            try:
                async for msg in pubsub.listen():
                    try:
                        if not msg:
                            continue
                        # Only handle actual messages
                        if msg.get("type") != "message":
                            continue
                        channel = msg.get("channel")
                        data = msg.get("data")
                        if isinstance(channel, bytes):
                            channel = channel.decode()
                        if isinstance(data, bytes):
                            try:
                                data = data.decode()
                            except Exception:
                                data = str(data)
                        if channel and channel.startswith("room:"):
                            room_id = channel.split(":", 1)[1]
                            await self._broadcast_to_room(room_id, data)
                    except Exception:
                        # Continue processing subsequent messages on error
                        continue
            except Exception:
                # If the pubsub listener fails, retry after a short delay
                await asyncio.sleep(1.0)
                if getattr(self, 'redis', None):
                    # spawn a new listener task
                    asyncio.create_task(self.start_redis_listener())

        asyncio.create_task(_listener())


manager = ConnectionManager()


@router.websocket("/ws/{room_id}/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, peer_id: str):
    # Register socket (but do not add to active room until approved)
    await manager.connect(websocket, room_id, peer_id)
    try:
        while True:
            data = await websocket.receive_text()
            try:
                msg = json.loads(data)
            except Exception:
                # non-json payload -> broadcast to room
                await manager.publish(room_id, data)
                continue

            mtype = msg.get("type")

            # Handle role announcement from clients
            if mtype == "announce":
                role = msg.get("role")
                manager.roles[(room_id, peer_id)] = role or "patient"
                if role == "host":
                    # add host to active room
                    manager.rooms.setdefault(room_id, []).append(peer_id)
                    # inform this host of any pending requests
                    for (r, pid), ws in list(manager.pending.items()):
                        if r == room_id:
                            try:
                                await websocket.send_text(json.dumps({"type": "join_request", "from": pid, "name": msg.get("name") or "Patient"}))
                            except Exception:
                                pass
                continue

            # Patient requests to join -> notify hosts, keep in pending
            if mtype == "join_request":
                # mark role as patient
                manager.roles[(room_id, peer_id)] = "patient"
                manager.pending[(room_id, peer_id)] = websocket
                # notify hosts in room
                hosts = [pid for pid in manager.rooms.get(room_id, []) if manager.roles.get((room_id, pid)) == "host"]
                payload = json.dumps({"type": "join_request", "from": peer_id, "name": msg.get("name") or "Patient"})
                for hid in hosts:
                    hws = manager.sockets.get((room_id, hid))
                    if hws:
                        try:
                            await hws.send_text(payload)
                        except Exception:
                            pass
                continue

            # Host approves a pending join
            if mtype == "approve_join":
                target = msg.get("target")
                pending_ws = manager.pending.get((room_id, target))
                if pending_ws:
                    try:
                        await pending_ws.send_text(json.dumps({"type": "connection_granted", "from": peer_id}))
                    except Exception:
                        pass
                    # move pending into active room
                    manager.pending.pop((room_id, target), None)
                    manager.rooms.setdefault(room_id, []).append(target)
                    manager.roles[(room_id, target)] = "patient"
                continue

            # Host rejects a pending join
            if mtype == "reject_join":
                target = msg.get("target")
                pending_ws = manager.pending.get((room_id, target))
                if pending_ws:
                    try:
                        await pending_ws.send_text(json.dumps({"type": "connection_rejected", "from": peer_id, "reason": msg.get("reason")}))
                        await pending_ws.close()
                    except Exception:
                        pass
                    manager.pending.pop((room_id, target), None)
                    manager.roles.pop((room_id, target), None)
                    manager.sockets.pop((room_id, target), None)
                continue

            # Otherwise, only allow broadcast if the sender is active in the room
            if (room_id, peer_id) in manager.sockets and peer_id in manager.rooms.get(room_id, []):
                # Allow common WebRTC signaling types plus chat and ping
                # (chat messages must be relayed so in-call chat works)
                allowed_signal_types = ['offer', 'answer', 'candidate', 'chat', 'ping']
                if mtype in allowed_signal_types:
                    await manager.publish(room_id, json.dumps(msg))
                else:
                    # Preserve existing behaviour for any other payloads by forwarding
                    await manager.publish(room_id, json.dumps(msg))
            else:
                # ignore signaling from non-approved participants
                try:
                    await websocket.send_text(json.dumps({"type": "error", "message": "not_approved"}))
                except Exception:
                    pass
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id, peer_id)
