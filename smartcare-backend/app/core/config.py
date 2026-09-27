import os
import logging
from typing import List, Tuple
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


def _load_keys() -> Tuple[str, str]:
    private_key = os.getenv("PRIVATE_KEY", "")
    public_key = os.getenv("PUBLIC_KEY", "")

    if not private_key or not public_key:
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
                        private_key = f.read()
                    with open(pub_p, "r", encoding="utf-8") as f:
                        public_key = f.read()
                    if private_key and public_key:
                        break
                except Exception:
                    pass

    if not private_key or not public_key:
        logging.warning("USING GENERATED KEYS. Set PRIVATE_KEY and PUBLIC_KEY in production.")
        from cryptography.hazmat.primitives import serialization
        from cryptography.hazmat.primitives.asymmetric import rsa
        _key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        private_key = _key.private_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        ).decode("utf-8")
        public_key = _key.public_key().public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        ).decode("utf-8")
    else:
        private_key = private_key.replace("\\n", "\n").strip()
        public_key = public_key.replace("\\n", "\n").strip()

    return private_key, public_key


def _get_cors_origins() -> List[str]:
    cors_raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://smartcare-six.vercel.app"
    )
    origins: List[str] = []
    for origin in cors_raw.split(","):
        trimmed = origin.strip()
        if trimmed:
            origins.append(trimmed.rstrip("/"))
            origins.append(trimmed.rstrip("/") + "/")
    return list(set(origins))


_default_private_key, _default_public_key = _load_keys()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="ignore")

    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "SmartCare AI"

    # DATABASE
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/dbname")

    # SECURITY
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ALGORITHM: str = "RS256"

    # CRYPTO KEYS
    PRIVATE_KEY: str = _default_private_key
    PUBLIC_KEY: str = _default_public_key

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
    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=_get_cors_origins)


settings = Settings()
