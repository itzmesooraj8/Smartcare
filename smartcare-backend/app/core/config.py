import os


class Settings:
    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str | None = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    # READ SECRETS FROM ENVIRONMENT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcare.db")
    REDIS_URL: str | None = os.getenv("REDIS_URL")


settings = Settings()
