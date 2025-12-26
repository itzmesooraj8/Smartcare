from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from jose import jwt, JWTError
from ...core.config import settings
from ...database import get_db

router = APIRouter()


# --- NEW: Notification Service (Mock) ---
class NotificationService:
    @staticmethod
    def send_confirmation(patient_id: str, doctor_id: int, time: datetime):
        # In production, replace this print with SendGrid/Twilio API calls
        print(f"📧 [NOTIFICATION] SMS/Email sent to Patient {patient_id}: 'Appointment confirmed with Dr. {doctor_id} at {time}'")
# ----------------------------------------


class AppointmentCreate(BaseModel):
    doctor_id: int = Field(..., description="Doctor user id")
    appointment_time: datetime
    reason: Optional[str] = None
    type: str = Field("video", description="video or in-person")


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return str(sub)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/", status_code=201)
def create_appointment(payload: AppointmentCreate, user_id: str = Depends(get_current_user_id), db=Depends(get_db)):
    # Prevent double booking: check existing appointment for same doctor and time
    select_sql = "SELECT id FROM appointments WHERE doctor_id = :doctor_id AND appointment_time = :appointment_time LIMIT 1"
    existing = db.execute(select_sql, {
        "doctor_id": payload.doctor_id,
        "appointment_time": payload.appointment_time,
    }).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor is already booked at this time")

    # Insert appointment into DB
    insert_sql = """
    INSERT INTO appointments (doctor_id, patient_id, appointment_time, status, reason)
    VALUES (:doctor_id, :patient_id, :appointment_time, :status, :reason)
    RETURNING id, doctor_id, patient_id, appointment_time, status, reason, created_at
    """
    try:
        res = db.execute(insert_sql, {
            "doctor_id": payload.doctor_id,
            "patient_id": user_id,
            "appointment_time": payload.appointment_time,
            "status": 'booked',
            "reason": payload.reason,
        })
        db.commit()
        # --- NEW: Trigger Notification ---
        # This runs only if the commit succeeds
        try:
            NotificationService.send_confirmation(user_id, payload.doctor_id, payload.appointment_time)
        except Exception:
            # Do not fail appointment creation if notification fails; just log
            print("[WARNING] NotificationService failed to send confirmation")
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Doctor is already booked at this time")
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create appointment: {e}")

    row = res.first()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create appointment")

    return {
        "id": str(row[0]),
        "doctor_id": row[1],
        "patient_id": row[2],
        "appointment_time": row[3].isoformat() if row[3] is not None else None,
        "status": row[4],
        "reason": row[5],
        "created_at": row[6].isoformat() if row[6] is not None else None,
    }
