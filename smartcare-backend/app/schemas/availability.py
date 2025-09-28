# app/schemas/availability.py
from pydantic import BaseModel
from datetime import datetime

class AvailabilityBase(BaseModel):
    slot_start: datetime
    slot_end: datetime

class AvailabilityCreate(AvailabilityBase):
    pass

class AvailabilityOut(AvailabilityBase):
    id: str
    doctor_id: str
    is_booked: bool

    class Config:
        orm_mode = True

