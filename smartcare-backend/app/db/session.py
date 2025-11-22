from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Use SQLite for a self-contained, error-free local setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./smartcare.db"

# check_same_thread is needed for SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
