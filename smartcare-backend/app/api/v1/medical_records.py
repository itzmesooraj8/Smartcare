from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional, Any
from datetime import date, datetime
from jose import jwt, JWTError
from sqlalchemy.orm import Session
import uuid
import json
import hmac
import hashlib

# Core Imports
from app.core.config import settings
from app.database import get_db
# 👇 SECURITY FIX: Import Server-Side Encryption Helpers
from app.core.encryption import encrypt_data, decrypt_data 
from app.models.medical_record import MedicalRecord
from app.models.user import User
from app.models.audit_log import AuditLog

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
router = APIRouter()

# --- Schemas ---
class EncryptedBlob(BaseModel):
    cipher_text: str
    iv: str
    version: Optional[str] = "v1"

class MedicalRecordCreate(BaseModel):
    title: str
    doctor_id: Optional[str] = None
    diagnosis: EncryptedBlob        # Client-Encrypted Data
    chief_complaint: Optional[EncryptedBlob] = None
    record_date: Optional[date] = None
    file_url: Optional[str] = None

# --- Auth Helper ---
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = authorization.split(" ")[1]
    try:
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        # Require full_access scope for medical record access
        scopes = payload.get('scopes', []) or []
        if 'full_access' not in scopes:
            raise HTTPException(status_code=403, detail="Full access token required")
        user = db.query(User).filter_by(id=str(payload.get('sub'))).first()
        if not user: raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# --- Endpoints ---

@router.post("/", status_code=201)
@limiter.limit("10/minute")
def create_medical_record(
    payload: MedicalRecordCreate, 
    request: Request,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    if getattr(current_user, 'role', 'patient') != 'patient':
        raise HTTPException(status_code=403, detail="Only patients may create records")

    try:
        # 🛡️ SECURITY FIX: Double Encryption (Hybrid Approach)
        # 1. Client sends {cipher_text: "..."} (Client Layer)
        # 2. Server converts that to JSON string.
        # 3. Server encrypts that JSON string using server ENCRYPTION_KEY (Server Layer).
        
        # Serialize Client Blobs
        diagnosis_json = payload.diagnosis.json()
        chief_complaint_json = payload.chief_complaint.json() if payload.chief_complaint else None
        notes_json = json.dumps({"file_url": payload.file_url}) if payload.file_url else None

        # Apply Server-Side Encryption
        server_enc_diagnosis = encrypt_data(diagnosis_json)
        server_enc_complaint = encrypt_data(chief_complaint_json) if chief_complaint_json else None
        server_enc_notes = encrypt_data(notes_json) if notes_json else None

        mr = MedicalRecord(
            id=str(uuid.uuid4()),
            patient_id=str(current_user.id),
            doctor_id=payload.doctor_id,
            title=payload.title,
            diagnosis=server_enc_diagnosis,        # Storing Server-Encrypted Token
            chief_complaint=server_enc_complaint,  # Storing Server-Encrypted Token
            notes=server_enc_notes,                # Storing Server-Encrypted Token
            created_at=datetime.utcnow()
        )
        db.add(mr)
        db.commit()
        db.refresh(mr)

        # Audit Log
        audit = AuditLog(
            user_id=str(current_user.id),
            target_id=str(mr.id),
            action="CREATE_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address="masked" # Simplified for brevity
        )
        db.add(audit)
        db.commit()
        
        # Return the original payload (client already has it)
        return {"id": mr.id, "status": "securely_stored"}

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Storage failure: {str(e)}")

@router.get("/", status_code=200)
def list_medical_records(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    role = getattr(current_user, 'role', 'patient')
    query = db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc())
    
    if role == 'doctor':
        query = query.filter(MedicalRecord.doctor_id == str(current_user.id))
    elif role == 'patient':
        query = query.filter(MedicalRecord.patient_id == str(current_user.id))

    rows = query.all()
    result = []
    
    for r in rows:
        # 🛡️ SECURITY FIX: Server-Side Decryption
        # 1. Decrypt Server Layer (Fernet) -> Get JSON String
        # 2. Parse JSON String -> Get Client Blob {cipher_text: "..."}
        try:
            raw_diag = decrypt_data(r.diagnosis)
            diag_obj = json.loads(raw_diag) if raw_diag else None
            
            raw_comp = decrypt_data(r.chief_complaint)
            comp_obj = json.loads(raw_comp) if raw_comp else None
            
            raw_notes = decrypt_data(r.notes)
            notes_obj = json.loads(raw_notes) if raw_notes else None
            
            result.append({
                "id": str(r.id),
                "patient_id": r.patient_id,
                "record_type": r.title,
                "diagnosis": diag_obj,       # Client receives their own ciphertext back
                "chief_complaint": comp_obj,
                "notes": notes_obj,
                "created_at": r.created_at.isoformat() if r.created_at else None,
            })
        except Exception:
            # If decryption fails, skip the record or return error placeholder
            continue
    # Audit: record that the user viewed records (immutable)
    try:
        audit = AuditLog(user_id=str(current_user.id), target_id=None, action="VIEW_RECORDS", resource_type="MEDICAL_RECORDS", ip_address="masked")
        db.add(audit)
        db.commit()
    except Exception:
        # Do not fail the request if audit logging fails; ensure operators see server logs.
        pass
            
    return result

