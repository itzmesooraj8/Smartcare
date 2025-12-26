import json
import asyncio
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.core.config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        # map room_id -> list of WebSocket
        self.rooms: dict[str, list[WebSocket]] = {}
        self.redis = None
        if getattr(settings, "REDIS_URL", None):
            try:
                self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True)
            except Exception:
                self.redis = None

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        self.rooms.setdefault(room_id, []).append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        conns = self.rooms.get(room_id) or []
        try:
            conns.remove(websocket)
        except ValueError:
            pass
        if not conns:
            self.rooms.pop(room_id, None)

    async def _broadcast_to_room(self, room_id: str, message: str):
        conns = list(self.rooms.get(room_id, []))
        for connection in conns:
            try:
                await connection.send_text(message)
            except Exception:
                try:
                    conns.remove(connection)
                except ValueError:
                    pass

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
        await pubsub.psubscribe("room:*")

        async def _listener():
            while True:
                try:
                    msg = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                    if msg and msg.get("type") in ("message",):
                        channel = msg.get("channel")
                        data = msg.get("data")
                        # channel like 'room:ROOMID'
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
                    await asyncio.sleep(0.5)
                await asyncio.sleep(0)

        asyncio.create_task(_listener())


manager = ConnectionManager()


@router.websocket("/ws/{room_id}/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, peer_id: str):
    await manager.connect(websocket, room_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Publish to Redis channel for the room (or broadcast locally)
            await manager.publish(room_id, data)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)
