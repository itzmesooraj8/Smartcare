from fastapi import APIRouter, Depends, HTTPException, Request, Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.vault_entry import VaultEntry
from app.models.user import User
from jose import jwt, JWTError
from app.core.config import settings
import pyotp
import logging

from app.core.security import get_current_user

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get('/key')
def get_vault_key(
    x_mfa_token: str | None = Header(None, alias='X-MFA-Token'),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """Return wrapped master key material only when both a valid full_access JWT
    and a valid TOTP (X-MFA-Token) are presented.
    """
    if not x_mfa_token:
        raise HTTPException(status_code=401, detail='X-MFA-Token header required')

    user = current_user

    # Verify TOTP
    if not getattr(user, 'mfa_totp_secret', None):
        raise HTTPException(status_code=403, detail='MFA not configured')
    try:
        totp = pyotp.TOTP(user.mfa_totp_secret)
        if not totp.verify(x_mfa_token, valid_window=1):
            raise HTTPException(status_code=403, detail='Invalid MFA token')
    except Exception:
        logger.warning('MFA verification failure (masked)')
        raise HTTPException(status_code=403, detail='Invalid MFA token')

    ve = db.query(VaultEntry).filter(VaultEntry.user_id == user.id).first()
    if not ve:
        raise HTTPException(status_code=404, detail='No vault key found')

    # Return wrapped key components for client-side unwrapping; never return plaintext
    return {
        'encrypted_master_key': ve.encrypted_master_key,
        'key_encryption_iv': ve.key_encryption_iv,
        'key_derivation_salt': ve.key_derivation_salt,
    }

from pydantic import BaseModel

class VaultSetupRequest(BaseModel):
    encrypted_master_key: str
    key_encryption_iv: str
    key_derivation_salt: str

@router.post('/key')
def setup_vault_key(
    payload: VaultSetupRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Initialize the vault for a user by storing their encrypted master key.
    This is used for legacy account migration or new account setup.
    """
    user = current_user

    # Check if vault already exists
    if db.query(VaultEntry).filter(VaultEntry.user_id == user.id).first():
        raise HTTPException(status_code=409, detail="Vault already initialized")
    
    ve = VaultEntry(
        user_id=user.id,
        encrypted_master_key=payload.encrypted_master_key,
        key_encryption_iv=payload.key_encryption_iv,
        key_derivation_salt=payload.key_derivation_salt
    )
    db.add(ve)
    db.commit()
    return {"status": "ok"}
