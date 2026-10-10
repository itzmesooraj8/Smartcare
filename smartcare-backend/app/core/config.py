import logging
import os
from typing import List, Tuple

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


logger = logging.getLogger("smartcare.config")


def _normalize_pem(value: str) -> str:
    """Normalize PEM values supplied through environment variables."""
    return value.replace("\\n", "\n").strip()


def _validate_keypair(private_key: str, public_key: str) -> Tuple[str, str]:
    """Parse and validate an RSA PKCS#8 private key and public key."""
    private_key = _normalize_pem(private_key)
    public_key = _normalize_pem(public_key)

    try:
        private_obj = serialization.load_pem_private_key(
            private_key.encode("utf-8"),
            password=None,
        )
        public_obj = serialization.load_pem_public_key(public_key.encode("utf-8"))
    except Exception as exc:
        raise RuntimeError("PRIVATE_KEY/PUBLIC_KEY could not be parsed as PEM keys") from exc

    if not isinstance(private_obj, rsa.RSAPrivateKey) or not isinstance(public_obj, rsa.RSAPublicKey):
        raise RuntimeError("PRIVATE_KEY/PUBLIC_KEY must be RSA keys")

    if private_obj.key_size != 2048:
        raise RuntimeError("PRIVATE_KEY must be a 2048-bit RSA key")

    if private_obj.public_key().public_numbers() != public_obj.public_numbers():
        raise RuntimeError("PRIVATE_KEY and PUBLIC_KEY do not form a matching keypair")

    return private_key, public_key


def _is_production_environment() -> bool:
    environment = os.getenv("ENVIRONMENT", "").strip().lower()
    render = os.getenv("RENDER", "").strip().lower() == "true"
    return environment == "production" or render


def _load_keys() -> Tuple[str, str]:
    """Load durable signing keys; production never generates ephemeral keys."""
    private_key = os.getenv("PRIVATE_KEY", "")
    public_key = os.getenv("PUBLIC_KEY", "")
    production = _is_production_environment()

    if private_key and public_key:
        return _validate_keypair(private_key, public_key)

    if production:
        raise RuntimeError(
            "Production startup requires PRIVATE_KEY and PUBLIC_KEY. "
            "Ephemeral signing-key generation is disabled in production."
        )

    # Local/test fallback only. These files are gitignored.
    candidate_dirs = [
        os.getcwd(),
        os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
        "/app",
        "/workspace/smartcare-backend",
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
                    return _validate_keypair(private_key, public_key)
            except RuntimeError:
                raise
            except OSError:
                logger.debug("Unable to read local signing-key files from %s", cdir)

    # Development/test fallback only.
    logger.warning("Using ephemeral RSA signing keys outside production.")
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_key = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    ).decode("utf-8")
    public_key = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    ).decode("utf-8")
    return private_key, public_key


def _get_cors_origins() -> List[str]:
    cors_raw = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://smartcare-six.vercel.app",
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

    DATABASE_URL: str = os.getenv("DATABASE_URL", "")

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8
    ALGORITHM: str = "RS256"

    PRIVATE_KEY: str = _default_private_key
    PUBLIC_KEY: str = _default_public_key

    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", SUPABASE_KEY)
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    LIVEKIT_API_KEY: str = os.getenv("LIVEKIT_API_KEY", "")
    LIVEKIT_API_SECRET: str = os.getenv("LIVEKIT_API_SECRET", "")
    LIVEKIT_URL: str = os.getenv("LIVEKIT_URL", "")

    GOOGLE_API_KEY: str = os.getenv("GOOGLE_API_KEY", "")
    REDIS_URL: str = os.getenv("REDIS_URL", "")

    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=_get_cors_origins)


settings = Settings()
