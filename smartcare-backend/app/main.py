from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
from redis.asyncio import Redis
from typing import Dict
from .core.config import settings

app = FastAPI(title="SmartCare Realtime Backend")


@app.get("/health")
async def health():
    return {"status": "ok"}


# Each room maps client_id -> WebSocket
rooms: Dict[str, Dict[str, WebSocket]] = {}


async def redis_listener(pubsub: Redis, room_id: str):
    chan = f"room:{room_id}"
    sub = pubsub.pubsub()
    await sub.subscribe(chan)
    try:
        async for message in sub.listen():
            if message is None:
                continue
            if message.get("type") != "message":
                continue
            data = message.get("data")
            try:
                text = data.decode() if isinstance(data, (bytes, bytearray)) else str(data)
            except Exception:
                text = str(data)
            # broadcast to connected clients
            conns = list(rooms.get(room_id, {}).items())
            for cid, ws in conns:
                try:
                    await ws.send_text(text)
                except Exception:
                    pass
    finally:
        try:
            await sub.unsubscribe(chan)
        except Exception:
            pass


@app.websocket("/ws/{room_id}/{client_id}")
async def ws_endpoint(websocket: WebSocket, room_id: str, client_id: str):
    await websocket.accept()
    rooms.setdefault(room_id, {})[client_id] = websocket

    redis = Redis.from_url(settings.REDIS_URL)

    # Start a background listener task for this room if not present
    loop = asyncio.get_event_loop()
    listener_task = loop.create_task(redis_listener(redis, room_id))

    try:
        while True:
            data = await websocket.receive_text()
            # When a client sends text, publish to redis channel for the room
            await redis.publish(f"room:{room_id}", data)
    except WebSocketDisconnect:
        pass
    finally:
        # cleanup
        rooms.get(room_id, {}).pop(client_id, None)
        if not rooms.get(room_id):
            rooms.pop(room_id, None)
        listener_task.cancel()
        try:
            await redis.close()
        except Exception:
            pass
