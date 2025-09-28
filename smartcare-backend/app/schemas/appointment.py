# app/schemas/appointment.py
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

class AppointmentStatus(str, Enum):
    booked = "booked"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"

class AppointmentCreateOut(BaseModel):
    slot_id: str

class AppointmentOut(BaseModel):
    id: str
    doctor_id: str
    patient_id: str
    slot_id: str | None
    appointment_time: datetime
    status: AppointmentStatus

    class Config:
        orm_mode = True
