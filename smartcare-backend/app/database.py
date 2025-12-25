from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .core.config import settings
from sqlalchemy.ext.declarative import declarative_base

# SQLAlchemy engine and session
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declarative base exported for Alembic and model definitions
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
