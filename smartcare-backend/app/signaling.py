import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from typing import Optional
import redis.asyncio as aioredis
from ..core.config import settings

router = APIRouter()


def get_redis_client():
    # Create client per import; redis library handles pooling
    return aioredis.from_url(settings.REDIS_URL, decode_responses=True)


@router.websocket("/ws/{room_id}/{peer_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, peer_id: str):
    await websocket.accept()
    redis = get_redis_client()
    channel_name = f"room:{room_id}"

    pubsub = redis.pubsub()
    await pubsub.subscribe(channel_name)

    # Publish peer-joined event so others know about us
    try:
        await redis.publish(channel_name, json.dumps({"type": "peer-joined", "peer": peer_id, "from": peer_id}))
    except Exception:
        pass

    async def reader():
        try:
            async for message in pubsub.listen():
                # message example: {'type':'message','pattern':None,'channel':'room:...','data':'...'}
                if not message:
                    continue
                if message.get("type") != "message":
                    continue
                data_raw = message.get("data")
                try:
                    payload = json.loads(data_raw)
                except Exception:
                    continue
                # skip our own messages
                if payload.get("from") == peer_id:
                    continue
                # optional 'to' filtering: if message addressed to someone else, skip
                to = payload.get("to")
                if to and to != peer_id:
                    continue
                try:
                    await websocket.send_text(json.dumps(payload))
                except Exception:
                    break
        except asyncio.CancelledError:
            return

    listener_task = asyncio.create_task(reader())

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except Exception:
                # ignore non-json
                continue

            # ensure sender is set so redis listeners can filter
            if not isinstance(msg, dict):
                continue
            msg["from"] = peer_id

            # if this is a leave/hangup, publish and break
            if msg.get("type") in ("leave", "hangup"):
                await redis.publish(channel_name, json.dumps(msg))
                break

            # publish message to room channel
            try:
                await redis.publish(channel_name, json.dumps(msg))
            except Exception:
                # best effort
                pass

    except WebSocketDisconnect:
        pass
    finally:
        try:
            # announce leaving
            await redis.publish(channel_name, json.dumps({"type": "peer-left", "peer": peer_id, "from": peer_id}))
        except Exception:
            pass
        try:
            listener_task.cancel()
        except Exception:
            pass
        try:
            await pubsub.unsubscribe(channel_name)
        except Exception:
            pass
        try:
            await redis.close()
        except Exception:
            pass
