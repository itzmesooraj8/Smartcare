from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()


@router.get("/")
def get_patients(db: Session = Depends(get_db)):
    # Placeholder - return empty list for now
    return []
