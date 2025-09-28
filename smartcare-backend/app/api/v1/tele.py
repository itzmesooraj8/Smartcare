# app/api/v1/tele.py
from fastapi import APIRouter, Depends, HTTPException
from app.core.deps import get_current_user
from app.db.session import get_db
from app.models.appointment import Appointment
from sqlalchemy.orm import Session
import uuid
import os

router = APIRouter()

JITSI_BASE = os.getenv("JITSI_BASE", "https://meet.jit.si")

@router.post("/appointments/{appointment_id}/join")
def join_appointment(appointment_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    appt = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appt:
        raise HTTPException(status_code=404, detail="Not found")
    if current_user.id not in (appt.patient_id, appt.doctor_id):
        raise HTTPException(status_code=403, detail="Not allowed")
    # create deterministic room id or random
    room = f"smartcare-{appointment_id}"
    url = f"{JITSI_BASE}/{room}"
    return {"url": url}
