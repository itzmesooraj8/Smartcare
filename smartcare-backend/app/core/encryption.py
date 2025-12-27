from cryptography.fernet import Fernet, InvalidToken
from .config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if not key:
        raise ValueError("FATAL: ENCRYPTION_KEY is not configured")
    if isinstance(key, str):
        key_bytes = key.encode()
    else:
        key_bytes = key
    return Fernet(key_bytes)


def encrypt_data(data: str) -> str:
    """Encrypt a string and return the token as text."""
    if data is None:
        return ""
    f = _get_fernet()
    token = f.encrypt(data.encode())
    return token.decode()


def decrypt_data(token: Optional[str]) -> str:
    """Attempt to decrypt and return plaintext. If decryption fails, log and return a generic error message.

    This prevents exceptions from bubbling to request handlers while preserving an audit trail.
    """
    if not token:
        return ""
    f = _get_fernet()
    try:
        return f.decrypt(token.encode()).decode()
    except InvalidToken:
        logger.warning("Failed to decrypt data: InvalidToken encountered")
        return "[decryption-error]"
    except Exception as exc:
        logger.exception("Unexpected error during decryption: %s", exc)
        return "[decryption-error]"
