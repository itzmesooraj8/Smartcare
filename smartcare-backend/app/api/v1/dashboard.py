from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime
from jose import jwt, JWTError

# FIX: Use absolute imports starting from the app package root
from app.core.config import settings
from app.database import get_db
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord

router = APIRouter()


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return str(sub)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.get("/dashboard")
def get_patient_dashboard(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # 1. Total Appointments (Real Count)
    total = db.query(Appointment).filter(Appointment.patient_id == user_id).count()

    # 2. Upcoming Appointments (Real Data)
    upcoming_rows = (
        db.query(Appointment)
        .filter(Appointment.patient_id == user_id, Appointment.appointment_time >= datetime.now())
        .order_by(Appointment.appointment_time.asc())
        .limit(5)
        .all()
    )

    upcoming = []
    for r in upcoming_rows:
        upcoming.append({
            "id": str(r.id),
            "appointment_time": r.appointment_time.isoformat() if r.appointment_time else None,
            "doctor_id": str(r.doctor_id) if r.doctor_id else None,
            "status": str(r.status),
        })

    # 3. Recent Medical Records (Real Data)
    rec_rows = (
        db.query(MedicalRecord)
        .filter(MedicalRecord.patient_id == user_id)
        .order_by(MedicalRecord.created_at.desc())
        .limit(3)
        .all()
    )

    records = []
    for r in rec_rows:
        records.append({
            "id": str(r.id),
            "title": r.title,
            "summary": r.diagnosis if hasattr(r, 'diagnosis') else getattr(r, 'summary', None),
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })

    stats = [{"label": "Total Appointments", "value": total}]

    # Returns empty lists [] if no data exists, ensuring a "Fresh" dashboard
    return {"stats": stats, "upcoming_appointments": upcoming, "recent_records": records}
