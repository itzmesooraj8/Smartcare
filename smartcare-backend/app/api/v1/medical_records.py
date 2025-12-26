from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date
from jose import jwt, JWTError
from ...core.config import settings
from ...database import get_db
import uuid

from ...models.audit_log import AuditLog

router = APIRouter()


class MedicalRecordCreate(BaseModel):
    title: str
    doctor_name: str
    diagnosis: str
    date: date
    file_url: Optional[str] = None


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
def create_medical_record(payload: MedicalRecordCreate, user_id: str = Depends(get_current_user_id), db=Depends(get_db)):
    insert_sql = """
    INSERT INTO medical_records (patient_id, doctor_id, record_type, summary, notes, created_at)
    VALUES (:patient_id, NULL, :record_type, :summary, :notes, now())
    RETURNING id, patient_id, record_type, summary, notes, created_at
    """
    try:
        res = db.execute(insert_sql, {
            "patient_id": user_id,
            "record_type": payload.title,
            "summary": payload.diagnosis,
            "notes": f"Doctor: {payload.doctor_name}; file: {payload.file_url or ''}",
        })
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create medical record: {e}")

    row = res.first()
    if not row:
        raise HTTPException(status_code=500, detail="Failed to create medical record")

    return {
        "id": str(row[0]),
        "patient_id": row[1],
        "record_type": row[2],
        "summary": row[3],
        "notes": row[4],
        "created_at": row[5].isoformat() if row[5] is not None else None,
    }



@router.get("/", status_code=200)
def list_medical_records(user_id: str = Depends(get_current_user_id), db=Depends(get_db), request: Request = None):
    """Return medical records for the authenticated user and log the access in AuditLog."""
    select_sql = "SELECT id, patient_id, record_type, summary, notes, created_at FROM medical_records WHERE patient_id = :patient_id ORDER BY created_at DESC"
    try:
        res = db.execute(select_sql, {"patient_id": user_id})
        rows = res.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch medical records: {e}")

    # Insert audit log entry for this read access
    try:
        ip = None
        if request and getattr(request, 'client', None):
            ip = request.client.host
        audit_id = str(uuid.uuid4())
        insert_audit = """
        INSERT INTO audit_logs (id, user_id, target_id, action, resource_type, timestamp, ip_address)
        VALUES (:id, :user_id, :target_id, :action, :resource_type, now(), :ip_address)
        """
        db.execute(insert_audit, {
            "id": audit_id,
            "user_id": user_id,
            "target_id": user_id,
            "action": 'VIEW',
            "resource_type": 'MEDICAL_RECORD',
            "ip_address": ip,
        })
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    result = []
    for r in rows:
        result.append({
            "id": str(r[0]),
            "patient_id": r[1],
            "record_type": r[2],
            "summary": r[3],
            "notes": r[4],
            "created_at": r[5].isoformat() if r[5] is not None else None,
        })
    return result
