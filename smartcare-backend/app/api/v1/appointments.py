from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy import text
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from jose import jwt, JWTError
from ...core.config import settings
from ...database import get_db
import logging
import hmac
import hashlib

logger = logging.getLogger(__name__)


def _pseudonymize(value: str) -> str:
    try:
        key = getattr(settings, 'ENCRYPTION_KEY', '')
        if not key:
            return 'pseudonym-missing-key'
        return hmac.new(key.encode(), value.encode(), hashlib.sha256).hexdigest()
    except Exception:
        return 'pseudonym-error'

router = APIRouter()


# --- NEW: Notification Service (Mock) ---
class NotificationService:
    @staticmethod
    def send_confirmation(patient_id: str, doctor_id: int, time: datetime):
        # In production, replace this print with SendGrid/Twilio API calls
        # Log pseudonymized identifiers only
        pid = _pseudonymize(str(patient_id))
        did = _pseudonymize(str(doctor_id))
        logger.info(f"[NOTIFICATION] appointment confirmed pid={pid} did={did} at={time.isoformat()}")
# ----------------------------------------


from typing import Optional, Union

class AppointmentCreate(BaseModel):
    doctor_id: Union[str, int] = Field(..., description="Doctor user id")
    appointment_time: datetime
    reason: Optional[str] = None
    type: str = Field("video", description="video or in-person")


from app.core.security import get_current_user, get_current_user_id
from app.models.appointment import Appointment
from app.models.user import User


@router.post("/", status_code=201)
async def create_appointment(payload: AppointmentCreate, user_id: str = Depends(get_current_user_id), db=Depends(get_db)):
    doctor_id_str = str(payload.doctor_id)
    # Prevent double booking: check existing appointment for same doctor and time
    select_sql = text("SELECT id FROM appointments WHERE doctor_id = :doctor_id AND appointment_time = :appointment_time LIMIT 1")
    existing = db.execute(select_sql, {
        "doctor_id": doctor_id_str,
        "appointment_time": payload.appointment_time,
    }).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor is already booked at this time")

    # Insert appointment into DB
    insert_sql = text("""
    INSERT INTO appointments (doctor_id, patient_id, appointment_time, status, reason)
    VALUES (:doctor_id, :patient_id, :appointment_time, :status, :reason)
    RETURNING id, doctor_id, patient_id, appointment_time, status, reason, created_at
    """)
    try:
        res = db.execute(insert_sql, {
            "doctor_id": doctor_id_str,
            "patient_id": user_id,
            "appointment_time": payload.appointment_time,
            "status": 'booked',
            "reason": payload.reason,
        })
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Doctor is already booked at this time")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create appointment: {e}")

    row = res.first()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create appointment")

    # --- Trigger Notification ---
    try:
        NotificationService.send_confirmation(user_id, doctor_id_str, payload.appointment_time)
    except Exception:
        logger.warning('NotificationService failed to send confirmation')

    canonical_event = {
        "id": str(row[0]),
        "doctor_id": str(row[1]),
        "patient_id": str(row[2]),
        "appointment_time": row[3].isoformat() if row[3] is not None else None,
        "status": row[4],
        "reason": row[5],
        "created_at": row[6].isoformat() if row[6] is not None else None,
    }

    # Authoritative realtime broadcast: patient + assigned doctor only
    try:
        from app.realtime import publish_appointment
        await publish_appointment(
            canonical_event,
            {str(row[2]), str(row[1])},
            event_type="created",
        )
    except Exception:
        logger.exception("Failed to publish appointment creation event")

    return canonical_event


@router.get("/")
def get_user_appointments(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    """
    Returns appointments for the authenticated patient.
    """
    from app.models.appointment import Appointment

    rows = (
        db.query(Appointment)
        .filter(Appointment.patient_id == user_id)
        .order_by(Appointment.appointment_time.asc())
        .all()
    )

    results = []
    for appt in rows:
        results.append({
            "id": str(appt.id),
            "doctor_id": appt.doctor_id,
            "patient_id": appt.patient_id,
            "appointment_time": appt.appointment_time.isoformat() if appt.appointment_time else None,
            "status": appt.status,
            "reason": appt.reason,
            "created_at": appt.created_at.isoformat() if appt.created_at else None,
        })
    return results


class AppointmentStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(confirmed|cancelled|completed|booked)$")


@router.patch("/{appointment_id}", status_code=200)
async def update_appointment_status(
    appointment_id: str,
    payload: AppointmentStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    user_id = str(current_user.id)
    is_patient = str(appointment.patient_id) == user_id
    is_doctor = str(appointment.doctor_id) == user_id
    if not (is_patient or is_doctor):
        raise HTTPException(status_code=403, detail="Not authorized for this appointment")

    # Patients may cancel their own appointment; clinicians may manage the
    # appointment lifecycle for an appointment they are assigned to.
    if is_patient and payload.status not in {"cancelled"}:
        raise HTTPException(status_code=403, detail="Patients may only cancel their own appointments")

    appointment.status = payload.status
    db.commit()
    db.refresh(appointment)

    event = {
        "id": str(appointment.id),
        "doctor_id": str(appointment.doctor_id),
        "patient_id": str(appointment.patient_id),
        "appointment_time": appointment.appointment_time.isoformat() if appointment.appointment_time else None,
        "status": appointment.status,
        "reason": appointment.reason,
        "created_at": appointment.created_at.isoformat() if appointment.created_at else None,
    }

    lifecycle_event = payload.status if payload.status in {"confirmed", "cancelled", "completed"} else "updated"

    from app.realtime import publish_appointment
    await publish_appointment(
        event,
        {str(appointment.patient_id), str(appointment.doctor_id)},
        event_type=lifecycle_event,
    )

    return event
