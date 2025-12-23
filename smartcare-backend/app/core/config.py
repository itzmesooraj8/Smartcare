import os
import logging
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

# Load backend .env if present
backend_env = Path(__file__).resolve().parents[2] / ".env"
if backend_env.exists():
    load_dotenv(dotenv_path=str(backend_env))
else:
    load_dotenv()


def validate_env():
    """Validate key environment variables and log clear messages.

    Rules:
    - If `POSTGRES_URL` / `DATABASE_URL` not provided, fallback to SQLite (warning).
    - Warn if `GROK_API_KEY` and `XAI_API_URL` are both missing (chatbot will be rule-based).
    - Warn if `SUPABASE_SERVICE_ROLE_KEY` missing when `SUPABASE_URL` present.
    """
    errors = []
    warnings = []

    db_url = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL") or os.getenv("POSTGRES_PRISMA_URL")
    if not db_url:
        warnings.append("No Postgres DB URL found; using local SQLite fallback for development.")

    grok = os.getenv("GROK_API_KEY") or os.getenv("XAI_API_KEY")
    xai_url = os.getenv("XAI_API_URL")
    if not grok and not xai_url:
        warnings.append("No GROK/XAI config found. Chatbot will use rule-based fallback unless configured.")

    supabase_url = os.getenv("SUPABASE_URL")
    supabase_role = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url and not supabase_role:
        warnings.append("SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is missing — server-side operations may fail.")

    # In production enforce stricter checks
    env = os.getenv("ENV") or os.getenv("RUN_ENV") or os.getenv("NODE_ENV")
    if env and env.lower() == "production":
        if not db_url:
            errors.append("DATABASE_URL (or POSTGRES_URL) is required in production")
        if not (grok or xai_url):
            errors.append("GROK_API_KEY or XAI_API_URL is required in production for chatbot functionality")
        if supabase_url and not supabase_role:
            errors.append("SUPABASE_SERVICE_ROLE_KEY is required in production when SUPABASE_URL is set")

    # Log warnings and errors
    for w in warnings:
        logger.warning(w)
    if errors:
        for e in errors:
            logger.error(e)
        raise RuntimeError("Missing required environment variables; see logs for details")

    # Return a simple dict of important settings
    return {
        "db_url": db_url,
        "grok_key": grok,
        "xai_url": xai_url,
        "supabase_url": supabase_url,
        "supabase_role": supabase_role,
    }
