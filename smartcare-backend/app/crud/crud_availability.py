from sqlalchemy.orm import Session
from app.models.availability import Availability
from app.schemas.availability import AvailabilityCreate

def create_availability(db: Session, doctor_id: int, data: AvailabilityCreate):
    slot = Availability(
        doctor_id=doctor_id,
        slot_time=data.slot_time
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot

def list_availability(db: Session, doctor_id: int):
    return db.query(Availability).filter_by(doctor_id=doctor_id, is_booked=False).all()

def mark_booked(db: Session, slot_id: int):
    slot = db.query(Availability).get(slot_id)
    if slot:
        slot.is_booked = True
        db.commit()
    return slot
