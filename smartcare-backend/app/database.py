from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Request
from contextlib import contextmanager
from typing import Optional, Generator, Dict, Any
from .core.config import settings
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import Engine
import urllib.parse
import os
import logging

logger = logging.getLogger("smartcare.database")

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
        u = parts.get('user') or os.getenv('user') or 'smartcare_backend'
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

# Ensure standard postgresql:// schemes normalize to installed psycopg2 driver
if DB_URL and DB_URL.startswith("postgresql://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg2://", 1)

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
    env = os.getenv("ENVIRONMENT", "").lower()
    if env in ("production", "prod") or os.getenv("RENDER") or os.getenv("VERCEL"):
        raise RuntimeError("DATABASE_URL environment variable is required in production environment.")
    # Fallback for local development / test environments when DATABASE_URL is unset
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


def verify_connection_security(db: Session) -> Dict[str, Any]:
    """
    Diagnostic helper to verify the active runtime database role and RLS configuration.
    Confirms:
    1. Runtime user is 'smartcare_backend' (not superuser 'postgres' or 'service_role')
    2. 'rolbypassrls' is False (runtime role is bound by Row Level Security)
    """
    dialect = db.bind.dialect.name if db.bind else "unknown"
    if dialect != "postgresql":
        return {
            "dialect": dialect,
            "current_user": "non-postgres",
            "rolbypassrls": False,
            "status": "DEVELOPMENT_NON_POSTGRES"
        }

    row = db.execute(text(
        "SELECT current_user AS username, "
        "COALESCE((SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user), false) AS rolbypassrls"
    )).mappings().first()

    current_role = row["username"] if row else "unknown"
    bypasses_rls = bool(row["rolbypassrls"]) if row else False

    return {
        "dialect": "postgresql",
        "current_user": current_role,
        "rolbypassrls": bypasses_rls,
        "is_smartcare_backend": (current_role == "smartcare_backend"),
        "is_secure": (not bypasses_rls and current_role == "smartcare_backend")
    }


@contextmanager
def transactional_session(user_id: Optional[str] = None) -> Generator[Session, None, None]:
    """
    Controlled transaction lifecycle context manager.
    Enforces transaction-local PostgreSQL identity and fails closed on error.

    Lifecycle:
    1. Creates Session
    2. Begins explicit transaction
    3. Executes SET LOCAL app.current_user_id = :uid (transaction-scoped)
    4. Yields session to caller
    5. Commits transaction on success; rolls back on exception
    6. Closes session in finally block (ensures pool hygiene)
    """
    db = SessionLocal()
    try:
        db.begin()
        if user_id:
            if db.bind and db.bind.dialect.name == "postgresql":
                # SET LOCAL binds the user context strictly to the current transaction.
                # Must fail closed if identity establishment fails.
                db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user_id)})
        yield db
        db.commit()
    except Exception as exc:
        db.rollback()
        logger.error(f"Transaction failed, rolled back: {exc}")
        raise
    finally:
        db.close()


def get_db(request: Request) -> Generator[Session, None, None]:
    """
    Database session dependency with transaction-local identity.

    CRITICAL SECURITY INVARIANTS:
    1. Reads exclusively from request.state.current_user_id (populated ONLY by verified RS256 JWT middleware).
    2. Binds identity via transaction-scoped SET LOCAL app.current_user_id.
    3. FAILS CLOSED (rolls back and raises) if identity establishment fails.
    4. Explicit transaction boundary (begin -> commit / rollback) ensures connection pooling
       never leaks identity across requests.
    """
    user_id = getattr(request.state, "current_user_id", None) if hasattr(request, "state") else None
    db = SessionLocal()
    try:
        db.begin()
        if user_id:
            if db.bind and db.bind.dialect.name == "postgresql":
                # Fail closed: NO try/except pass!
                db.execute(text("SET LOCAL app.current_user_id = :uid"), {"uid": str(user_id)})
        yield db
        db.commit()
    except Exception as exc:
        db.rollback()
        raise
    finally:
        db.close()

