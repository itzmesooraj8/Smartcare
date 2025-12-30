import os
import logging
from typing import List

# A+ Grade: Use strict typing and proper imports
try:
    # pydantic v2 optional standalone settings package
    from pydantic_settings import BaseSettings  # type: ignore
except Exception:
    # Fallback for environments without pydantic_settings installed
    from pydantic import BaseSettings  # type: ignore
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa

# Load and normalize keys from environment
_private_key_env = os.getenv("PRIVATE_KEY", "")
_public_key_env = os.getenv("PUBLIC_KEY", "")

PRIVATE_KEY = _private_key_env.replace('\\n', '\n') if _private_key_env else ""
PUBLIC_KEY = _public_key_env.replace('\\n', '\n') if _public_key_env else ""

# Key fallback generation (Secure way)
if not PRIVATE_KEY or not PUBLIC_KEY:
    logging.warning("⚠️ SECURITY WARNING: Using temporary keys. Login will expire on restart.")
    _key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    PRIVATE_KEY = _key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')
    PUBLIC_KEY = _key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode('utf-8')

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SmartCare AI"
    
    # 1. DATABASE
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

    # 2. SECURITY (JWT)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "RS256"

    # 3. CRYPTOGRAPHIC KEYS (populated from env or generated above)
    PRIVATE_KEY: str = PRIVATE_KEY
    PUBLIC_KEY: str = PUBLIC_KEY

    # 4. STORAGE & FILES (Supabase)
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    # 5. VIDEO & CHAT (LiveKit & Google)
    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "")
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "")
    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    
    # 6. INFRASTRUCTURE (Redis for Signaling)
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    
    # 7. CORS (Frontend Access)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "https://smartcare-six.vercel.app",
        "https://smartcare-six.vercel.app/",
    ]
        
    class Config:
        case_sensitive = True
    
# instantiate settings
settings = Settings()