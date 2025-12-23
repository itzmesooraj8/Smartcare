import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# PostgreSQL connection URL
# Format: postgresql://<user>:<password>@<host>:<port>/<database>
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:ironman%402216@127.0.0.1:5432/smartcaredb")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    echo=True,      # Logs SQL queries, set False in production
    future=True     # Use SQLAlchemy 2.0 style
)

# SessionLocal class for creating sessions
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base class for all models
Base = declarative_base()

# Dependency to use in FastAPI routes
def get_db():
    """
    Yields a database session to be used with FastAPI dependencies.
    Usage in route: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
