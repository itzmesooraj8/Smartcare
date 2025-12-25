from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from .core.config import settings
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.engine import Engine

# Determine DB URL (fallback to local sqlite if not provided)
DB_URL = getattr(settings, "DATABASE_URL", None) or "sqlite:///./sql_app.db"

# If using sqlite, enable check_same_thread and a timeout to reduce lock contention
connect_args = {}
if DB_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False, "timeout": 30}

engine = create_engine(DB_URL, connect_args=connect_args)

# Enable WAL and sane synchronous mode for sqlite to allow concurrent reads/writes
@event.listens_for(Engine, "connect")
def _sqlite_pragma(dbapi_connection, connection_record):
    if DB_URL.startswith("sqlite"):
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
