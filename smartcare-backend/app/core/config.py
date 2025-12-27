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

        # Debugging presence of critical variables (do not print secrets)
        print(f"Checking SUPABASE_URL: {'Found' if bool(self.SUPABASE_URL) else 'Missing'}")
        print(f"Checking SUPABASE_SERVICE_ROLE_KEY: {'Found' if bool(self.SUPABASE_SERVICE_ROLE_KEY) else 'Missing'}")
        print(f"Checking SUPABASE_ANON_KEY: {'Found' if bool(self.SUPABASE_ANON_KEY) else 'Missing'}")

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
        if not self.SECRET_KEY or str(self.SECRET_KEY).lower() in ("", "change-me", "changeme", "default"):
            missing.append("SECRET_KEY")
        if not self.DATABASE_URL or str(self.DATABASE_URL).lower() in ("", "change-me", "changeme", "default"):
            missing.append("DATABASE_URL")
        # Supabase service keys are required for server-side storage/operations
        if not self.SUPABASE_URL or str(self.SUPABASE_URL).lower() in ("", "change-me", "changeme", "default"):
            missing.append("SUPABASE_URL")
        if not self.SUPABASE_SERVICE_ROLE_KEY or str(self.SUPABASE_SERVICE_ROLE_KEY).lower() in ("", "change-me", "changeme", "default"):
            missing.append("SUPABASE_SERVICE_ROLE_KEY")
        if not self.ENCRYPTION_KEY or str(self.ENCRYPTION_KEY).lower() in ("", "change-me", "changeme", "default"):
            missing.append("ENCRYPTION_KEY")

        if missing:
            # Fail fast with an exception so test harnesses and platforms capture the error clearly
            raise ValueError(f"FATAL: Missing or defaulted required environment variables: {', '.join(missing)}")

        # Validate SUPABASE_URL format (simple check)
        if self.SUPABASE_URL and not str(self.SUPABASE_URL).startswith("http"):
            raise ValueError("FATAL: SUPABASE_URL does not appear to be a valid URL (must start with http)")


settings = Settings()
