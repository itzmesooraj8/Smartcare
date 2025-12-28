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
from app.models.mfa_recovery_code import MFARecoveryCode
from app.api.v1 import mfa as mfa_module
from app.core.config import settings

router = APIRouter()

class RecoveryCodesResponse(BaseModel):
    recovery_codes: List[str]

class RecoveryUseRequest(BaseModel):
    email: str
    recovery_code: str


def _hash_code(code: str) -> str:
    # Use HMAC with ENCRYPTION_KEY as salt for server-side hashing
    key = settings.ENCRYPTION_KEY.encode()
    return hmac.new(key, code.encode(), hashlib.sha256).hexdigest()


@router.post("/generate", response_model=RecoveryCodesResponse)
def generate_recovery_codes(request: Request, db: Session = Depends(get_db)) -> Dict[str, List[str]]:
    # Authenticated users should call this; for simplicity, require cookie auth
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Resolve user
    from jose import jwt
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == str(user_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Generate 10 Base32 human-friendly recovery codes and store hashed
    codes: List[str] = []
    for _ in range(10):
        # base32 w/o padding
        raw = base64.b32encode(secrets.token_bytes(10)).decode().rstrip("=")
        codes.append(raw)
        hc = _hash_code(raw)
        rc = MFARecoveryCode(user_id=user.id, code_hash=hc)
        db.add(rc)

    db.commit()

    return {"recovery_codes": codes}


@router.post("/use")
def use_recovery_code(payload: RecoveryUseRequest, db: Session = Depends(get_db)) -> Dict[str, str]:
    # Find user by email
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Hash supplied code and find an unused match
    supplied_hash = _hash_code(payload.recovery_code)
    rc = db.query(MFARecoveryCode).filter(MFARecoveryCode.user_id == user.id, MFARecoveryCode.code_hash == supplied_hash, MFARecoveryCode.used == False).first()
    if not rc:
        raise HTTPException(status_code=401, detail="Invalid or used recovery code")

    # Mark as used
    rc.used = True
    db.add(rc)
    db.commit()

    # Retrieve wrapped master key from vault table or VaultEntry
    from app.models.vault_entry import VaultEntry
    ve = db.query(VaultEntry).filter(VaultEntry.user_id == user.id).first()
    if not ve:
        raise HTTPException(status_code=404, detail="No wrapped key found")

    # Return wrapped key material (server does NOT return plaintext master key)
    return {
        "wrapped_key": ve.encrypted_master_key,
        "key_encryption_iv": ve.key_encryption_iv,
        "key_derivation_salt": ve.key_derivation_salt,
    }
