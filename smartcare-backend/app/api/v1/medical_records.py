import json
import logging
import uuid
from datetime import date, datetime, time
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.encryption import decrypt_data, encrypt_data
from app.core.security import get_current_user
from app.database import get_db
from app.models.appointment import Appointment
from app.models.medical_record import MedicalRecord
from app.models.user import User

logger = logging.getLogger("smartcare.medical_records")
limiter = Limiter(key_func=get_remote_address)
router = APIRouter()


class EncryptedBlob(BaseModel):
    cipher_text: str
    iv: str
    version: Optional[str] = "v1"


class MedicalRecordCreate(BaseModel):
    patient_id: str = Field(min_length=1)
    title: str = Field(default="Visit", max_length=120)
    diagnosis: EncryptedBlob
    chief_complaint: Optional[EncryptedBlob] = None
    record_date: Optional[date] = None
    file_url: Optional[str] = None


@router.post("/", status_code=201)
@limiter.limit("10/minute")
def create_medical_record(
    payload: MedicalRecordCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    # The production RLS policy deliberately prohibits patient-authored clinical
    # records. Only a treating doctor with an eligible appointment may create one.
    if current_user.role != "doctor":
        raise HTTPException(status_code=403, detail="Only treating doctors may create clinical records")

    appointment = (
        db.query(Appointment)
        .filter(
            Appointment.doctor_id == str(current_user.id),
            Appointment.patient_id == payload.patient_id,
            Appointment.status.in_(["booked", "completed"]),
        )
        .first()
    )
    if not appointment:
        raise HTTPException(status_code=403, detail="No eligible appointment authorizes this patient record")

    patient = db.query(User).filter(User.id == payload.patient_id, User.is_active.is_(True)).first()
    if not patient or patient.role != "patient":
        raise HTTPException(status_code=404, detail="Patient not found")

    # Preserve the existing database contract: medical_records has user_id,
    # diagnosis, notes, doctor_name, date, and created_at (no patient_id/title/
    # doctor_id/chief_complaint columns).
    diagnosis_json = payload.diagnosis.model_dump_json() if hasattr(payload.diagnosis, "model_dump_json") else payload.diagnosis.json()
    notes_payload = {
        "title": payload.title,
        "chief_complaint": payload.chief_complaint.model_dump() if payload.chief_complaint and hasattr(payload.chief_complaint, "model_dump") else (payload.chief_complaint.dict() if payload.chief_complaint else None),
        "file_url": payload.file_url,
    }
    record_date = datetime.combine(payload.record_date, time.min) if payload.record_date else datetime.utcnow()

    record = MedicalRecord(
        id=str(uuid.uuid4()),
        user_id=str(patient.id),
        diagnosis=encrypt_data(diagnosis_json),
        notes=encrypt_data(json.dumps(notes_payload)) if any([payload.title, payload.chief_complaint, payload.file_url]) else None,
        doctor_name=current_user.full_name or current_user.email,
        date=record_date,
        created_at=datetime.utcnow(),
    )
    try:
        db.add(record)
        db.flush()
        db.execute(text("SELECT public.log_user_audit_event(:action, :res, :target, :ip)"), {
            "action": "CREATE_RECORD",
            "res": "MEDICAL_RECORD",
            "target": str(record.id),
            "ip": "masked",
        })
        db.commit()
        return {"id": str(record.id), "status": "securely_stored"}
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        logger.exception("Medical record creation failed")
        raise HTTPException(status_code=500, detail="Unable to securely store medical record")


@router.get("/", status_code=200)
def list_medical_records(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc())
    if current_user.role == "patient":
        query = query.filter(MedicalRecord.user_id == str(current_user.id))
    elif current_user.role not in ("doctor", "admin"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    rows = query.all()
    result = []
    for record in rows:
        try:
            raw_diagnosis = decrypt_data(record.diagnosis) if record.diagnosis else None
            diagnosis_blob = json.loads(raw_diagnosis) if raw_diagnosis else None
            raw_notes = decrypt_data(record.notes) if record.notes else None
            notes_payload = json.loads(raw_notes) if raw_notes else {}
            complaint = notes_payload.get("chief_complaint")
            result.append({
                "id": str(record.id),
                "patient_id": str(record.user_id),
                "visit_type": notes_payload.get("title") or "Visit",
                "record_type": notes_payload.get("title") or "Visit",
                "diagnosis": diagnosis_blob,
                "chief_complaint": complaint,
                "notes": None,
                "doctor_name": record.doctor_name,
                "created_at": record.created_at.isoformat() if record.created_at else None,
            })
        except Exception:
            # Do not silently hide corruption: record a redacted operational event.
            logger.warning("Unable to decrypt medical record id=%s", record.id)
            raise HTTPException(status_code=500, detail="A medical record could not be decrypted")

    try:
        db.execute(text("SELECT public.log_user_audit_event(:action, :res, NULL, :ip)"), {
            "action": "VIEW_RECORDS",
            "res": "MEDICAL_RECORDS",
            "ip": "masked",
        })
        db.commit()
    except Exception:
        db.rollback()
        logger.exception("Medical record view audit failed")
        raise HTTPException(status_code=500, detail="Unable to complete audited medical-record access")
    return result
