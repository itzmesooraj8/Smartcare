"""Authenticated SmartCare realtime gateway.

Browser authentication is taken from the HttpOnly access_token cookie used by
the REST API. Clients never publish directly to Supabase Realtime and cannot
choose another user's private channel.
"""
from __future__ import annotations

import asyncio
import json
import logging
from collections import defaultdict
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from jose import JWTError

from app.core.security import verify_access_token

logger = logging.getLogger("smartcare.realtime")
router = APIRouter()


class RealtimeManager:
    def __init__(self) -> None:
        self.connections: dict[str, set[WebSocket]] = defaultdict(set)
        self.websocket_users: dict[WebSocket, str] = {}

    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        await websocket.accept()
        self.connections[user_id].add(websocket)
        self.websocket_users[websocket] = user_id

    def disconnect(self, websocket: WebSocket) -> None:
        user_id = self.websocket_users.pop(websocket, None)
        if not user_id:
            return
        sockets = self.connections.get(user_id)
        if sockets:
            sockets.discard(websocket)
            if not sockets:
                self.connections.pop(user_id, None)

    async def send_user(self, user_id: str, event: dict[str, Any]) -> None:
        payload = json.dumps(event, separators=(",", ":"))
        sockets = list(self.connections.get(str(user_id), set()))
        for websocket in sockets:
            try:
                await websocket.send_text(payload)
            except Exception:
                self.disconnect(websocket)

    async def send_users(self, user_ids: set[str], event: dict[str, Any]) -> None:
        await asyncio.gather(
            *(self.send_user(user_id, event) for user_id in user_ids),
            return_exceptions=True,
        )

    def user_id_for(self, websocket: WebSocket) -> str | None:
        return self.websocket_users.get(websocket)


manager = RealtimeManager()


def _authenticate_cookie(websocket: WebSocket) -> dict[str, Any]:
    token = websocket.cookies.get("access_token")
    if not token:
        raise ValueError("missing access token")
    try:
        payload = verify_access_token(token)
    except JWTError as exc:
        raise ValueError("invalid access token") from exc

    scopes = payload.get("scopes", [])
    if "full_access" not in scopes:
        raise PermissionError("full access scope required")
    user_id = payload.get("sub")
    if not user_id:
        raise ValueError("missing subject")
    return payload


@router.websocket("/ws/realtime")
async def realtime_websocket(websocket: WebSocket) -> None:
    try:
        payload = _authenticate_cookie(websocket)
    except PermissionError:
        await websocket.close(code=1008, reason="full_access required")
        return
    except ValueError:
        await websocket.close(code=1008, reason="authentication required")
        return

    user_id = str(payload["sub"])
    await manager.connect(websocket, user_id)
    await manager.send_user(user_id, {
        "type": "connection",
        "event": "connected",
        "user_id": user_id,
    })

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                message = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_json({"type": "error", "code": "invalid_json"})
                continue

            event_type = message.get("type")
            if event_type == "ping":
                await websocket.send_json({"type": "pong"})
                continue

            # The client may request a presence subscription, but it cannot
            # publish appointment/message mutations through this socket.
            if event_type in {"subscribe_appointments", "subscribe_messages", "join_presence"}:
                await websocket.send_json({
                    "type": "subscription",
                    "event": event_type,
                    "status": "ready",
                })
                continue

            if event_type in {"appointment_update", "new_message"}:
                await websocket.send_json({
                    "type": "error",
                    "code": "server_broadcast_only",
                    "message": "Mutations must use authenticated REST endpoints.",
                })
                continue

            await websocket.send_json({"type": "error", "code": "unsupported_event"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        logger.exception("Realtime websocket failed for user=%s", user_id)
        manager.disconnect(websocket)


async def publish_appointment(event: dict[str, Any], user_ids: set[str]) -> None:
    await manager.send_users(
        {str(user_id) for user_id in user_ids if user_id},
        {"type": "appointment", "event": "updated", "data": event},
    )


async def publish_message(event: dict[str, Any], user_ids: set[str]) -> None:
    await manager.send_users(
        {str(user_id) for user_id in user_ids if user_id},
        {"type": "message", "event": "created", "data": event},
    )


async def publish_presence(room_id: str, user_ids: set[str], data: dict[str, Any]) -> None:
    await manager.send_users(
        {str(user_id) for user_id in user_ids if user_id},
        {"type": "presence", "event": "updated", "room_id": room_id, "data": data},
    )
