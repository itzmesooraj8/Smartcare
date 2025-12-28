"""
Security helpers for RS256 JWT creation and verification.

Design choices:
- Use RSA private/public key pair stored in environment variables.
- Sign tokens with RS256 (asymmetric) to prevent symmetric key leakage.
- Tokens include `sub`, `exp`, and `iat`. Keep payload minimal to reduce
  exposure of PII if token is leaked.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import jwt, JWTError
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

ACCESS_TOKEN_EXPIRE_MINUTES = 60


def create_jwt(subject: str, extra: Optional[Dict[str, Any]] = None, expires_minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES) -> str:
    """Create an RS256 signed JWT using server PRIVATE_KEY.

    The private key must be provided via environment variable `PRIVATE_KEY`.
    """
    now = datetime.utcnow()
    payload: Dict[str, Any] = {
        'sub': subject,
        'iat': int(now.timestamp()),
        'exp': int((now + timedelta(minutes=expires_minutes)).timestamp()),
    }
    if extra:
        payload.update(extra)

    # Use RS256 private key to sign
    token = jwt.encode(payload, settings.PRIVATE_KEY, algorithm='RS256')
    return token


def verify_jwt(token: str) -> Dict[str, Any]:
    """Verify RS256 token using PUBLIC_KEY. Raises JWTError on failure."""
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=['RS256'])
        return payload
    except JWTError as e:
        logger.debug('JWT verification failed')
        raise
