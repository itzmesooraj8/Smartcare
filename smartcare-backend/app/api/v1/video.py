import os
from fastapi import APIRouter, Depends, HTTPException

# Support either `livekit` (imported as `livekit`) or `livekit-api` (imported as `livekit_api`).
try:
    from livekit import api
except Exception:
    try:
        import livekit_api as _lk
        api = getattr(_lk, 'api', _lk)
    except Exception:
        raise

from app.api.v1.medical_records import get_current_user

router = APIRouter()

# ---------------------------------------------------------
# GET THESE KEYS FROM https://cloud.livekit.io/ (FREE)
# ---------------------------------------------------------
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "devsecret")
LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://your-project.livekit.cloud")


@router.get("/token/{room_id}")
async def get_livekit_token(room_id: str, current_user = Depends(get_current_user)):
    """
    Generates a secure JWT Access Token for LiveKit Video Rooms.
    """
    if not LIVEKIT_API_KEY or "devkey" in LIVEKIT_API_KEY:
        # Do not print sensitive data to STDOUT; log a warning instead.
        import logging
        logging.getLogger(__name__).warning("LiveKit keys not configured; using defaults for local development")

    # Define permissions (User can join room, publish video/audio)
    grant = api.VideoGrant(room_join=True, room_name=room_id)

    # Identify the user
    # Use user id as identity to avoid leaking email addresses into third-party tokens
    identity = str(getattr(current_user, 'id', 'guest'))

    # Create the token
    token = api.AccessToken(
        LIVEKIT_API_KEY,
        LIVEKIT_API_SECRET,
        grant=grant,
        identity=identity,
        name=getattr(current_user, 'full_name', identity)
    )

    return {"token": token.to_jwt(), "url": LIVEKIT_URL}
