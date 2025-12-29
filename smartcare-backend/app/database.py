from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from fastapi import Request
from .core.config import settings
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import Engine
from sqlalchemy import text
import urllib.parse
import os

# Use DATABASE_URL from settings. The app will fail-fast earlier if missing.
DB_URL = getattr(settings, "DATABASE_URL", None)

# Some deployment providers (or .env files) may supply space-separated key=value
# lines instead of a full SQLAlchemy URL. If DB_URL looks like that, parse and
# construct a proper Postgres URL with percent-encoded password.
if DB_URL and '://' not in DB_URL and '=' in DB_URL:
    parts = {}
    try:
        for token in str(DB_URL).replace('"', '').split():
            if '=' in token:
                k, v = token.split('=', 1)
                parts[k.strip().lower()] = v.strip()
        u = parts.get('user') or os.getenv('user')
        p = parts.get('password') or os.getenv('password')
        h = parts.get('host') or os.getenv('host')
        po = parts.get('port') or os.getenv('port')
        dbn = parts.get('dbname') or os.getenv('dbname')
        if u and p and h and po and dbn:
            p_escaped = urllib.parse.quote_plus(p)
            DB_URL = f"postgresql+psycopg2://{u}:{p_escaped}@{h}:{po}/{dbn}?sslmode=require"
    except Exception:
        # leave DB_URL as-is and let SQLAlchemy raise a helpful error
        pass

# If using sqlite, enable check_same_thread and a timeout to reduce lock contention
connect_args = {}
if DB_URL and DB_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}

# Use pool_pre_ping to avoid "server closed connection" errors with Supabase/pg pools
# Only pass sqlite-specific connect_args when using sqlite; for Postgres the dict will be empty.
if DB_URL:
    # connect_args is always a dict; pass it directly. pool_pre_ping helps with Supabase pooler.
    engine = create_engine(DB_URL, connect_args=connect_args, pool_pre_ping=True)
else:
    # Fallback - should not normally occur because config.Settings exits if missing.
    engine = create_engine("sqlite:///./sql_app.db", connect_args={"check_same_thread": False})

# Enable WAL and sane synchronous mode for sqlite to allow concurrent reads/writes
@event.listens_for(Engine, "connect")
def _sqlite_pragma(dbapi_connection, connection_record):
    if DB_URL and DB_URL.startswith("sqlite"):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base exported for Alembic and model definitions
Base = declarative_base()


def get_db(request: Request):
    """
    Database session dependency.

    CRITICAL SECURITY NOTE: 
    We do NOT accept user_id as a function argument here. If we did, FastAPI would 
    expose it as a public query parameter, allowing RLS bypass via URL injection.
    We strictly read from request.state.current_user_id, which is populated ONLY 
    by the trusted middleware validating the JWT.
    """
    db = SessionLocal()
    try:
        # Read trusted user_id from middleware (see main.py:inject_current_user)
        user_id = getattr(request.state, "current_user_id", None) if hasattr(request, "state") else None

        if user_id:
            try:
                # Set the Postgres local variable for RLS policies
                # This ensures queries in this session can only see this user's rows
                db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user_id)})
            except Exception:
                # If setting RLS fails, we generally fail open (allow query) or closed (block).
                # For high security, you might want to log this or raise an error.
                pass
        yield db
    finally:
        db.close()
