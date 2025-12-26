import os


class Settings:
    SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
    SUPABASE_ANON_KEY: str | None = os.getenv("SUPABASE_ANON_KEY")
    SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    # READ SECRETS FROM ENVIRONMENT
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me")
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./smartcare.db")
    REDIS_URL: str | None = os.getenv("REDIS_URL")
    # Fernet key for encrypting sensitive fields at rest.
    # Generate with: python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    # Example: k9sX9T2z6Qq0-6JHc4mYVq9aWl0Z2V5bGxrc2VjcmV0MTE=
    ENCRYPTION_KEY: str | None = os.getenv("ENCRYPTION_KEY", "k9sX9T2z6Qq0-6JHc4mYVq9aWl0Z2V5bGxrc2VjcmV0MTE=")


settings = Settings()
