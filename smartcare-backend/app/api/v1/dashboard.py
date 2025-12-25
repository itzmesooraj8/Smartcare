from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional
from jose import jwt, JWTError
from ...core.config import settings
from ...database import get_db

router = APIRouter()


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


@router.get("/dashboard")
def get_patient_dashboard(user_id: str = Depends(get_current_user_id), db: Session = Depends(get_db)):
    # total appointments
    total_q = "SELECT COUNT(*) as cnt FROM appointments WHERE patient_id = :uid"
    total_res = db.execute(total_q, {"uid": user_id}).first()
    total = int(total_res[0]) if total_res is not None else 0

    # upcoming appointments (next 5)
    upcoming_q = "SELECT id, appointment_time, doctor_id, status FROM appointments WHERE patient_id = :uid AND appointment_time >= now() ORDER BY appointment_time ASC LIMIT 5"
    upcoming_rows = db.execute(upcoming_q, {"uid": user_id}).fetchall()
    upcoming = []
    for r in upcoming_rows:
        upcoming.append({
            "id": str(r[0]),
            "appointment_time": r[1].isoformat() if r[1] is not None else None,
            "doctor_id": str(r[2]) if r[2] is not None else None,
            "status": str(r[3]) if r[3] is not None else None,
        })

    # recent medical records (latest 3)
    records_q = "SELECT id, title, summary, created_at FROM medical_records WHERE patient_id = :uid ORDER BY created_at DESC LIMIT 3"
    rec_rows = db.execute(records_q, {"uid": user_id}).fetchall()
    records = []
    for r in rec_rows:
        records.append({
            "id": str(r[0]),
            "title": r[1],
            "summary": r[2],
            "created_at": r[3].isoformat() if r[3] is not None else None,
        })

    stats = [
        {"label": "Total Appointments", "value": total},
    ]

    return {
        "stats": stats,
        "upcoming_appointments": upcoming,
        "recent_records": records,
    }
