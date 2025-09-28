# app/signaling.py
import asyncio
import json
from typing import Dict, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from fastapi import FastAPI
from fastapi.security import HTTPBearer
from jose import jwt, JWTError
from app.db.session import get_db  # optional: to verify appointment / user
from app.models.user import User
from sqlalchemy.orm import Session
import os

# Config - use env vars in production
SECRET_KEY = os.getenv("SECRET_KEY", "change_this_in_prod")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

app = FastAPI()
router = APIRouter()
bearer = HTTPBearer(auto_error=False)

# In-memory room state for simple deployments
# rooms: room_id -> { client_id -> websocket }
rooms: Dict[str, Dict[str, WebSocket]] = {}

async def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def auth_websocket(websocket: WebSocket):
    # Expect token in query params: ws://.../ws?token=xxx&room=roomid
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    payload = await verify_jwt_token(token)
    if not payload:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return None
    return payload

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket signaling endpoint.

    Client must connect with query params:
      /ws?token=JWT&room=ROOM_ID&peer=PEER_ID

    Messages are JSON with shape:
      { "type": "offer/answer/candidate/join/leave", "to": "<peer_id>", "sdp": {...}, "candidate": {...} }
    """
    await websocket.accept()
    payload = await auth_websocket(websocket)
    if not payload:
        return

    room_id = websocket.query_params.get("room")
    peer_id = websocket.query_params.get("peer")
    if not room_id or not peer_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # join room
    room = rooms.setdefault(room_id, {})
    room[peer_id] = websocket

    # notify others in room that a new peer joined
    join_msg = json.dumps({"type": "peer-joined", "peer": peer_id})
    for pid, ws in list(room.items()):
        if pid != peer_id:
            try:
                await ws.send_text(join_msg)
            except:
                pass

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)

            # enforce expected schema
            msg_type = data.get("type")
            dest = data.get("to")

            if msg_type in ("offer", "answer", "candidate", "hangup", "metadata"):
                if not dest:
                    # some messages like broadcast can omit 'to'
                    continue
                # forward to target peer if present
                target_ws = room.get(dest)
                if target_ws:
                    forward = json.dumps({
                        "type": msg_type,
                        "from": peer_id,
                        "payload": data.get("payload")  # for sdp/candidate/metadata
                    })
                    await target_ws.send_text(forward)
                else:
                    # target not found: optionally queue or return error
                    err = json.dumps({"type": "error", "message": f"Peer {dest} not found"})
                    await websocket.send_text(err)

            elif msg_type == "leave":
                # peer voluntarily leaving
                break

            else:
                # unknown type: ignore or send error
                err = json.dumps({"type": "error", "message": f"Unknown type {msg_type}"})
                await websocket.send_text(err)

    except WebSocketDisconnect:
        pass
    except Exception:
        # log
        pass
    finally:
        # cleanup on disconnect
        room = rooms.get(room_id, {})
        if peer_id in room:
            del room[peer_id]
        # notify remaining peers
        leave_msg = json.dumps({"type": "peer-left", "peer": peer_id})
        for pid, ws in list(room.items()):
            try:
                await ws.send_text(leave_msg)
            except:
                pass

        # if room empty, remove
        if not room:
            rooms.pop(room_id, None)
