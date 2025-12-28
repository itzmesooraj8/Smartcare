from __future__ import annotations
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
import hashlib
import hmac
import base64
import secrets

from app.database import get_db
from app.models.user import User
from app.models.recovery_seed import RecoverySeed
from app.models.vault_entry import VaultEntry
from app.core.config import settings

router = APIRouter()

class GenerateSeedResponse(BaseModel):
    recovery_seed: str

class UseSeedRequest(BaseModel):
    email: str
    recovery_seed: str


def _hash_seed(seed: str) -> str:
    key = settings.ENCRYPTION_KEY.encode()
    return hmac.new(key, seed.encode(), hashlib.sha256).hexdigest()


@router.post("/generate", response_model=GenerateSeedResponse)
def generate_seed(request: Request, db: Session = Depends(get_db)) -> Dict[str, str]:
    """Generate a single 24-word emergency recovery seed and store a hash server-side.

    The raw seed is returned only once and MUST be recorded by the user.
    """
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Resolve user via JWT
    from jose import jwt
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Create a 24-word-style seed using Base32 grouped segments (human-friendly)
    raw = base64.b32encode(secrets.token_bytes(16)).decode().rstrip("=")
    # Expand to 24 short words by slicing
    words = [raw[i:i+4] for i in range(0, min(len(raw), 96), 4)]
    if len(words) < 24:
        # pad with extra random base32
        while len(words) < 24:
            words.append(base64.b32encode(secrets.token_bytes(2)).decode().rstrip("=")[:4])
    seed = " ".join(words[:24])

    seed_hash = _hash_seed(seed)
    rs = RecoverySeed(user_id=user.id, seed_hash=seed_hash)
    db.add(rs)
    db.commit()

    return {"recovery_seed": seed}


@router.post("/use")
def use_seed(payload: UseSeedRequest, db: Session = Depends(get_db)) -> Dict[str, str]:
    # Find user by email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    supplied_hash = _hash_seed(payload.recovery_seed)
    rs = db.query(RecoverySeed).filter(RecoverySeed.user_id == user.id, RecoverySeed.seed_hash == supplied_hash, RecoverySeed.used == False).first()
    if not rs:
        raise HTTPException(status_code=401, detail="Invalid or used recovery seed")

    # Mark used
    rs.used = True
    db.add(rs)
    db.commit()

    # Return wrapped master key components (if present)
    ve = db.query(VaultEntry).filter(VaultEntry.user_id == user.id).first()
    if not ve:
        raise HTTPException(status_code=404, detail="No wrapped key found")

    return {
        "wrapped_key": ve.encrypted_master_key,
        "key_encryption_iv": ve.key_encryption_iv,
        "key_derivation_salt": ve.key_derivation_salt,
    }
