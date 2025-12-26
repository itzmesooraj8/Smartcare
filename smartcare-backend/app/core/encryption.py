from cryptography.fernet import Fernet, InvalidToken
from .config import settings
from typing import Optional


def _get_fernet() -> Fernet:
    key = settings.ENCRYPTION_KEY
    if not key:
        raise ValueError("ENCRYPTION_KEY is not configured")
    if isinstance(key, str):
        key_bytes = key.encode()
    else:
        key_bytes = key
    return Fernet(key_bytes)


def encrypt_text(plaintext: Optional[str]) -> Optional[str]:
    if plaintext is None:
        return None
    f = _get_fernet()
    return f.encrypt(plaintext.encode()).decode()


def decrypt_text(token: Optional[str]) -> Optional[str]:
    if token is None:
        return None
    f = _get_fernet()
    try:
        return f.decrypt(token.encode()).decode()
    except InvalidToken:
        # If decryption fails, return the original token so older unencrypted data still shows
        return token
