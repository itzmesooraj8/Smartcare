from cryptography.fernet import Fernet, InvalidToken
import os
import logging
from typing import Optional

logger = logging.getLogger(__name__)


def _get_cipher():
    key = os.getenv("ENCRYPTION_KEY")
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
    cipher = _get_cipher()
    return cipher.encrypt(data.encode()).decode()


def decrypt_data(token: Optional[str]) -> str:
    """Decrypt a token to plaintext; return generic error marker on failure."""
    if not token:
        return ""
    cipher = _get_cipher()
    try:
        return cipher.decrypt(token.encode()).decode()
    except InvalidToken:
        logger.warning("decrypt_data: invalid token or key")
        return "[decryption-error]"
    except Exception as exc:
        logger.exception("decrypt_data: unexpected error: %s", exc)
        return "[decryption-error]"
