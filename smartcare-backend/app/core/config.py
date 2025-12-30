import os
import logging
from typing import List

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SmartCare AI"
    
    # 1. DATABASE
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

    # 2. SECURITY (JWT)
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "RS256"

    # 3. CRYPTOGRAPHIC KEYS (The Fix)
    # We try to read these from Render's Environment Variables first.
    PRIVATE_KEY: str = os.getenv("PRIVATE_KEY", "")
    PUBLIC_KEY: str = os.getenv("PUBLIC_KEY", "")

    # If Render didn't provide them (Localhost fallback), we generate temporary ones.
    if not PRIVATE_KEY or not PUBLIC_KEY:
        logging.warning("⚠️  SECURITY WARNING: Using temporary generated keys. Sessions will die on restart.")
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        
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
    else:
        # Clean up newlines if they were pasted weirdly in Render
        PRIVATE_KEY = PRIVATE_KEY.replace('\\n', '\n')
        PUBLIC_KEY = PUBLIC_KEY.replace('\\n', '\n')

    # 4. CORS (Frontend URLs)
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "https://smartcare-six.vercel.app", 
        "https://smartcare-six.vercel.app/",
    ]

settings = Settings()