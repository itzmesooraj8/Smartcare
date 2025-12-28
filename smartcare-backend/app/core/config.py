import os
from dotenv import load_dotenv
from typing import Optional

# Optional lightweight secret fetch from a protected 'secrets' table (simulated vault)
try:
    import psycopg2
except Exception:
    psycopg2 = None

# Load .env.local first (if present) then .env — explicit and predictable.
load_dotenv('.env.local', override=True)
load_dotenv(override=True)


class SecretManager:
    def __init__(self, db_url: Optional[str]):
        self.db_url = db_url

    def get(self, name: str) -> Optional[str]:
        # Prefer environment variables (explicit and auditable)
        val = os.getenv(name)
        if val:
            # Normalize common PEM encodings: Render/CI often provide PEMs with literal "\n" sequences.
            v = val.strip()
            # Remove surrounding quotes if present
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            # Unescape literal newlines
            if "\\n" in v:
                v = v.replace('\\n', '\n')
            return v

        # If a database-backed secret store is available, try to fetch there
        if not self.db_url or not psycopg2:
            return None

        try:
            conn = psycopg2.connect(self.db_url)
            cur = conn.cursor()
            cur.execute("SELECT value FROM secrets WHERE name=%s LIMIT 1", (name,))
            row = cur.fetchone()
            cur.close()
            conn.close()
            if row:
                v = row[0]
                if isinstance(v, str):
                    if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                        v = v[1:-1]
                    if "\\n" in v:
                        v = v.replace('\\n', '\n')
                return v
        except Exception:
            # Do not leak errors about secret backends — caller will handle missing secrets
            return None


class Settings:
    def __init__(self) -> None:
        # Load connection settings early so SecretManager can use them
        self.DATABASE_URL: str | None = os.getenv("DATABASE_URL")
        self._secrets = SecretManager(self.DATABASE_URL)

        # Secrets are pulled via SecretManager (env first, then DB-backed vault)
        self.PRIVATE_KEY: str | None = self._secrets.get("PRIVATE_KEY")
        self.PUBLIC_KEY: str | None = self._secrets.get("PUBLIC_KEY")
        self.ENCRYPTION_KEY: str | None = self._secrets.get("ENCRYPTION_KEY")

        # Normalize PEMs: Render often injects PEMs as single-line with literal \n sequences.
        def _normalize_pem(val: str | None) -> str | None:
            if not val:
                return None
            v = val.strip()
            # Remove wrapping quotes if present
            if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
                v = v[1:-1]
            # Convert literal \n sequences into real newlines
            if "\\n" in v:
                v = v.replace('\\n', '\n')
            return v.strip()

        self.PRIVATE_KEY = _normalize_pem(self.PRIVATE_KEY)
        self.PUBLIC_KEY = _normalize_pem(self.PUBLIC_KEY)

        # Optional runtime settings
        self.REDIS_URL: str | None = os.getenv("REDIS_URL")

        # Supabase keys (server-side operations)
        self.SUPABASE_URL: str | None = os.getenv("SUPABASE_URL")
        self.SUPABASE_ANON_KEY: str | None = os.getenv("SUPABASE_ANON_KEY")
        self.SUPABASE_SERVICE_ROLE_KEY: str | None = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

        # Trusted proxies (comma-separated list of trusted reverse proxies)
        trusted = os.getenv("TRUSTED_PROXIES")
        self.TRUSTED_PROXIES = [p.strip() for p in trusted.split(',')] if trusted else []

        # CORS: comma separated list; default to local dev origins if not supplied
        allowed_origins_str = os.getenv("ALLOWED_ORIGINS")
        if allowed_origins_str:
            self.ALLOWED_ORIGINS = [o.strip() for o in allowed_origins_str.split(",") if o.strip()]
        else:
            # Production default: only allow the Vercel frontend domain.
            # Local development should set ALLOWED_ORIGINS via environment variables.
            self.ALLOWED_ORIGINS = [
                "https://smartcare-six.vercel.app",
            ]

        # Fail fast for required secrets — explicit and clear errors for audits.
        missing = []
        if not self.PRIVATE_KEY:
            missing.append("PRIVATE_KEY")
        if not self.PUBLIC_KEY:
            missing.append("PUBLIC_KEY")
        if not self.ENCRYPTION_KEY:
            missing.append("ENCRYPTION_KEY")
        if not self.DATABASE_URL:
            missing.append("DATABASE_URL")

        if missing:
            raise ValueError(f"Missing required secrets or configuration: {', '.join(missing)}")


settings = Settings()
