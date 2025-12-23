from pydantic import BaseSettings


class Settings(BaseSettings):
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    XAI_API_KEY: str | None = None
    SECRET_KEY: str = "change-me"
    DATABASE_URL: str = "sqlite:///./smartcare.db"
    REDIS_URL: str = "redis://redis:6379/0"

    class Config:
        env_file = ".env"


settings = Settings()
