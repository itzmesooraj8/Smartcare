from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from datetime import date
from jose import jwt, JWTError
from ...core.config import settings
from ...core.encryption import encrypt_text, decrypt_text
from ...database import get_db
from sqlalchemy.orm import Session
import uuid

from ...models.audit_log import AuditLog
from ...models.medical_record import MedicalRecord
from ...models.user import User

router = APIRouter()


class MedicalRecordCreate(BaseModel):
    title: str
    # Require a doctor_id (FK) instead of an arbitrary doctor_name string
    doctor_id: str
    diagnosis: str
    date: date
    file_url: Optional[str] = None


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
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
        user = db.query(User).filter_by(id=str(sub)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


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
def create_medical_record(payload: MedicalRecordCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), request: Request = None):
    # Only patients may create records for themselves via this endpoint
    if getattr(current_user, 'role', 'patient') != 'patient':
        raise HTTPException(status_code=403, detail="Only patients may create records via this endpoint")

    # Verify doctor exists to ensure non-repudiation (doctor_id must reference a real user)
    doctor = db.query(User).filter_by(id=payload.doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=400, detail="Provided doctor_id does not reference a valid user")

    try:
        enc_diagnosis = encrypt_text(payload.diagnosis)
        notes_plain = f"DoctorId: {payload.doctor_id}; file: {payload.file_url or ''}"
        enc_notes = encrypt_text(notes_plain)

        mr = MedicalRecord(
            patient_id=str(current_user.id),
            doctor_id=payload.doctor_id,
            title=payload.title,
            diagnosis=enc_diagnosis,
            notes=enc_notes,
        )
        db.add(mr)
        db.commit()
        db.refresh(mr)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create medical record: {e}")

    # Audit log the creation and capture client IP (X-Forwarded-For preferred)
    try:
        ip = None
        if request:
            xff = request.headers.get("x-forwarded-for")
            if xff:
                ip = xff.split(",")[0].strip()
            elif getattr(request, "client", None):
                ip = request.client.host

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=str(current_user.id),
            target_id=str(mr.id),
            action="ACCESS_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address=ip,
        )
        db.add(audit)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # Decrypt fields for response
    try:
        summary = decrypt_text(mr.diagnosis)
    except Exception:
        summary = mr.diagnosis
    try:
        notes = decrypt_text(mr.notes)
    except Exception:
        notes = mr.notes

    return {
        "id": str(mr.id),
        "patient_id": mr.patient_id,
        "record_type": mr.title,
        "summary": summary,
        "notes": notes,
        "created_at": mr.created_at.isoformat() if mr.created_at is not None else None,
    }



@router.get("/", status_code=200)
def list_medical_records(current_user: User = Depends(get_current_user), db: Session = Depends(get_db), request: Request = None):
    """Return medical records for the authenticated user and log the access in AuditLog.
    Patients see only their records; doctors see records assigned to them; admins see all.
    """
    try:
        role = getattr(current_user, 'role', 'patient')
        if role == 'doctor':
            rows = db.query(MedicalRecord).filter_by(doctor_id=str(current_user.id)).order_by(MedicalRecord.created_at.desc()).all()
        elif role == 'patient':
            rows = db.query(MedicalRecord).filter_by(patient_id=str(current_user.id)).order_by(MedicalRecord.created_at.desc()).all()
        else:
            rows = db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc()).all()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch medical records: {e}")

    # Insert audit log entry for this read access
    try:
        ip = None
        if request:
            xff = request.headers.get("x-forwarded-for")
            if xff:
                ip = xff.split(",")[0].strip()
            elif getattr(request, "client", None):
                ip = request.client.host

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=str(current_user.id),
            target_id=str(current_user.id),
            action="ACCESS_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address=ip,
        )
        db.add(audit)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    result = []
    for r in rows:
        # attempt to decrypt fields; if they are not encrypted, return raw
        try:
            dec_summary = decrypt_text(r.diagnosis)
        except Exception:
            dec_summary = r.diagnosis
        try:
            dec_notes = decrypt_text(r.notes)
        except Exception:
            dec_notes = r.notes

        result.append({
            "id": str(r.id),
            "patient_id": r.patient_id,
            "record_type": r.title,
            "summary": dec_summary,
            "notes": dec_notes,
            "created_at": r.created_at.isoformat() if r.created_at is not None else None,
        })
    return result
