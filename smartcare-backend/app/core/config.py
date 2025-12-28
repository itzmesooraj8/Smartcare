import os
from dotenv import load_dotenv
from typing import Optional

# Optional lightweight secret fetch from a protected 'secrets' table (simulated vault)
try:
    import psycopg2
except Exception:
    psycopg2 = None

# Load .env.local first (if present) then .env — explicit and predictable.
# Do NOT override existing environment variables so production (Render) vars take precedence.
load_dotenv('.env.local', override=False)
load_dotenv(override=False)


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
        # --- FIX STARTS HERE ---
        # Read raw env var and sanitize common copy/paste issues
        raw_url = os.getenv("DATABASE_URL")
        if raw_url:
            # Remove surrounding whitespace and quotes
            raw_url = raw_url.strip().strip("'").strip('"')
            # SQLAlchemy prefers postgresql:// over postgres://
            if raw_url.startswith("postgres://"):
                raw_url = raw_url.replace("postgres://", "postgresql://", 1)
        self.DATABASE_URL: str | None = raw_url
        # --- FIX ENDS HERE ---
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

        # CORS: handled via property below to safely parse env var when accessed.
        # The property will parse ALLOWED_ORIGINS from the environment on demand.

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

    @property
    def ALLOWED_ORIGINS(self) -> list[str]:
        raw = os.getenv("ALLOWED_ORIGINS", "")
        if not raw:
            return []
        return [origin.strip() for origin in raw.split(",") if origin]


settings = Settings()
