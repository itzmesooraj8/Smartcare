# app/api/v1/availability.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.db.base_class import Base
from app.db.session import get_db
from app.models.availability import Availability
from app.schemas.availability import AvailabilityCreate, AvailabilityOut
from app.models.user import User, UserRole
from app.core.roles import require_role

router = APIRouter()

@router.post("/create", response_model=AvailabilityOut)
def create_slot(data: AvailabilityCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.doctor]))):
    if data.slot_end <= data.slot_start:
        raise HTTPException(status_code=400, detail="slot_end must be after slot_start")
    slot = Availability(doctor_id=current_user.id, slot_start=data.slot_start, slot_end=data.slot_end)
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot

@router.get("/doctor/{doctor_id}", response_model=List[AvailabilityOut])
def list_slots(doctor_id: str, db: Session = Depends(get_db), after: datetime | None = None):
    q = db.query(Availability).filter(Availability.doctor_id == doctor_id, Availability.is_booked == False)
    if after:
        q = q.filter(Availability.slot_start >= after)
    slots = q.order_by(Availability.slot_start).all()
    return slots
