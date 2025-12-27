import os
from dotenv import load_dotenv

# Load .env.local first (if present) then .env — explicit and predictable.
load_dotenv('.env.local', override=True)
load_dotenv(override=True)


class Settings:
    def __init__(self) -> None:
        # Critical secrets (NO defaults) — application must fail if missing.
        self.SECRET_KEY: str | None = os.getenv("SECRET_KEY")
        self.ENCRYPTION_KEY: str | None = os.getenv("ENCRYPTION_KEY")
        self.DATABASE_URL: str | None = os.getenv("DATABASE_URL")

        # Optional runtime settings
        self.REDIS_URL: str | None = os.getenv("REDIS_URL")

        # Supabase keys (server-side operations)
        self.SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
        self.SUPABASE_ANON_KEY: str | None = os.getenv("SUPABASE_ANON_KEY")
        self.SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        # CORS: comma separated list; default to local dev origins if not supplied
        allowed_origins_str = os.getenv("ALLOWED_ORIGINS")
        if allowed_origins_str:
            self.ALLOWED_ORIGINS = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
        else:
            # Include common local dev hosts and the Vercel production domain used by the frontend.
            self.ALLOWED_ORIGINS = [
                "http://localhost:5173",
                "http://localhost:3000",
                "https://smartcare-six.vercel.app",
            ]

        # Fail fast for required secrets — explicit and clear errors for audits.
        missing = []
        if not self.SECRET_KEY:
            missing.append("SECRET_KEY")
        if not self.ENCRYPTION_KEY:
            missing.append("ENCRYPTION_KEY")
        if not self.DATABASE_URL:
            missing.append("DATABASE_URL")

        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")


settings = Settings()
