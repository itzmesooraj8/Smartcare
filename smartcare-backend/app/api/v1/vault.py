from fastapi import APIRouter, Depends, HTTPException, Request, Header
from app.database import get_db
from sqlalchemy.orm import Session
from app.models.vault_entry import VaultEntry
from app.models.user import User
from jose import jwt, JWTError
from app.core.config import settings
import pyotp
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_user_from_bearer(authorization: str | None, db: Session) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail='Invalid Authorization header')
    token = parts[1]
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=['RS256'])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail='Invalid token payload')
        user = db.query(User).filter(User.id == str(sub)).first()
        if not user:
            raise HTTPException(status_code=401, detail='User not found')
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail='Invalid token')


@router.get('/key')
def get_vault_key(
    authorization: str | None = Header(None, alias='Authorization'),
    x_mfa_token: str | None = Header(None, alias='X-MFA-Token'),
    db: Session = Depends(get_db),
) -> dict:
    """Return wrapped master key material only when both a valid bearer JWT
    and a valid TOTP (X-MFA-Token) are presented.
    """
    # Require both headers
    if not authorization or not x_mfa_token:
        raise HTTPException(status_code=401, detail='Authorization and X-MFA-Token required')

    user = _get_user_from_bearer(authorization, db)

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
