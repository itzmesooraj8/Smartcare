import json
import redis.asyncio as redis
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# Use absolute import for config inside the app package
from app.core.config import settings

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        # Initialize Redis client from settings
        self.redis = redis.from_url(settings.REDIS_URL, decode_responses=True) if settings.REDIS_URL else None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        try:
            self.active_connections.remove(websocket)
        except ValueError:
            pass

    async def broadcast(self, message: str):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(message)
            except Exception:
                try:
                    self.active_connections.remove(connection)
                except ValueError:
                    pass


manager = ConnectionManager()


@router.websocket("/ws/{room_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # In a real app, publish to Redis channel for room_id
            await manager.broadcast(f"Room {room_id}: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
