from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter()


@router.get("/")
def get_doctors(db: Session = Depends(get_db)):
    # Placeholder logic - replace with actual query later
    return []
