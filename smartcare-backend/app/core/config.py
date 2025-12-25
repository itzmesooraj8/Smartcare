import os
from pydantic import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    # READ SECRETS FROM ENVIRONMENT
    XAI_API_KEY: str | None = os.getenv("XAI_API_KEY")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcare.db")
    REDIS_URL: str | None = os.getenv("REDIS_URL")

    class Config:
        env_file = ".env"


settings = Settings()
