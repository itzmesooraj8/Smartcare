import os
import sys
from dotenv import load_dotenv

# Load .env.local explicitly first (Vercel/Render style), then fall back to .env
load_dotenv('.env.local', override=True)
load_dotenv(override=True)


class Settings:
    def __init__(self) -> None:
        # Optional Supabase configuration
        self.SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
        self.SUPABASE_ANON_KEY: str | None = os.getenv("SUPABASE_ANON_KEY")
        self.SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        # REQUIRED: Read secrets from environment. NO hardcoded defaults allowed.
        self.SECRET_KEY: str | None = os.getenv("SECRET_KEY")
        self.DATABASE_URL: str | None = os.getenv("DATABASE_URL")
        self.REDIS_URL: str | None = os.getenv("REDIS_URL")

        # Fernet key for encrypting sensitive fields at rest. Must be provided via env.
        self.ENCRYPTION_KEY: str | None = os.getenv("ENCRYPTION_KEY")

        # CORS: allow a comma-separated list in ALLOWED_ORIGINS (fall back to localhost dev origins)
        allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
        self.ALLOWED_ORIGINS = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]

        missing = []
        if not self.SECRET_KEY:
            missing.append("SECRET_KEY")
        if not self.DATABASE_URL:
            missing.append("DATABASE_URL")
        if not self.ENCRYPTION_KEY:
            missing.append("ENCRYPTION_KEY")

        if missing:
            print(
                f"FATAL: Missing required environment variables: {', '.join(missing)}.\n"
                "Set these before starting the application. Exiting.",
                file=sys.stderr,
            )
            sys.exit(1)


settings = Settings()
