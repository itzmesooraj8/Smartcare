import os
import logging
from typing import List
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SmartCare AI"

    # DATABASE
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

    # SECURITY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ALGORITHM: str = "RS256"

    # CRYPTO KEYS
    PRIVATE_KEY: str = os.getenv("PRIVATE_KEY", "")
    PUBLIC_KEY: str = os.getenv("PUBLIC_KEY", "")

    if not PRIVATE_KEY or not PUBLIC_KEY:
        # Try reading from candidate file locations
        candidate_dirs = [
            os.getcwd(),
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "/app",
            "/workspace/smartcare-backend"
        ]
        for cdir in candidate_dirs:
            priv_p = os.path.join(cdir, "private_key.pem")
            pub_p = os.path.join(cdir, "public_key.pem")
            if os.path.exists(priv_p) and os.path.exists(pub_p):
                try:
                    with open(priv_p, "r", encoding="utf-8") as f:
                        PRIVATE_KEY = f.read()
                    with open(pub_p, "r", encoding="utf-8") as f:
                        PUBLIC_KEY = f.read()
                    if PRIVATE_KEY and PUBLIC_KEY:
                        break
                except Exception:
                    pass

    if not PRIVATE_KEY or not PUBLIC_KEY:
        logging.warning("USING GENERATED KEYS. Set PRIVATE_KEY and PUBLIC_KEY in production.")
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        _key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        PRIVATE_KEY = _key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode("utf-8")
        PUBLIC_KEY = _key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")
    else:
        PRIVATE_KEY = PRIVATE_KEY.replace("\\n", "\n").strip()
        PUBLIC_KEY = PUBLIC_KEY.replace("\\n", "\n").strip()

    # EXTERNAL SERVICES
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", SUPABASE_KEY)
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "")
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "")

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")

    REDIS_URL: str = os.getenv("REDIS_URL", "")

    # CORS
    _cors_raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://smartcare-six.vercel.app"
    )
    _origins = []
    for origin in _cors_raw.split(","):
        trimmed = origin.strip()
        if trimmed:
            _origins.append(trimmed.rstrip("/"))
            _origins.append(trimmed.rstrip("/") + "/")
    BACKEND_CORS_ORIGINS: List[str] = list(set(_origins))

    class Config:
        case_sensitive = True


settings = Settings()
