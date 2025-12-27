from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from .core.config import settings
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import Engine
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
