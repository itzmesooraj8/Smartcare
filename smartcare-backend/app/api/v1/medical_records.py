from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address
from pydantic import BaseModel, Field
from typing import Optional, List, Any
import uuid

from app.database import get_db
from app.models.medical_record import MedicalRecord
from app.models.user import User
from app.models.audit_log import AuditLog
from datetime import datetime

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


# --- Local helper: JWT-based current user resolution ---
from jose import jwt, JWTError
from app.core.config import settings
import hmac
import hashlib

def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        raise HTTPException(status_code=401, detail="Invalid Authorization header")
    token = parts[1]
    try:
        # Verify token with RS256 public key
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        user = db.query(User).filter_by(id=str(sub)).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


# --- Zero-Knowledge Schemas ---
class EncryptedBlob(BaseModel):
    cipher_text: str
    iv: str
    version: str = "v1"


class MedicalRecordCreate(BaseModel):
    # Align with HL7 FHIR minimal metadata
    patient_id: str
    effectiveDateTime: Optional[str] = None
    visit_type: str = "consultation"
    # Encrypted clinical blobs
    chief_complaint: EncryptedBlob
    diagnosis: EncryptedBlob
    notes: Optional[EncryptedBlob] = None


class MedicalRecordResponse(BaseModel):
    id: str
    resourceType: str = "MedicalRecord"
    patient_id: str
    effectiveDateTime: Optional[str] = None
    visit_type: str
    chief_complaint: Any
    diagnosis: Any
    notes: Optional[Any]
    created_at: Any


# --- Endpoints ---
@router.post("/", response_model=MedicalRecordResponse, status_code=201)
@limiter.limit("10/minute")
def create_medical_record(
    request: Request,
    payload: MedicalRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Build a canonical FHIR Observation wrapper for audit/export purposes
        fhir_obs = {
            "resourceType": "Observation",
            "id": str(uuid.uuid4()),
            "status": "final",
            "effectiveDateTime": payload.effectiveDateTime or datetime.utcnow().isoformat(),
            "subject": {"reference": f"Patient/{current_user.id}"},
            "performer": [],
            "extension": [
                {"url": "http://smartcare.local/EncryptedPayload", "valueString": payload.chief_complaint.cipher_text}
            ]
        }

        new_record = MedicalRecord(
            patient_id=current_user.id,
            doctor_id=None,
            chief_complaint=payload.chief_complaint.dict(),
            diagnosis=payload.diagnosis.dict(),
            notes=payload.notes.dict() if payload.notes else None,
            visit_type=payload.visit_type,
            fhir_observation=fhir_obs,
        )
        db.add(new_record)
        db.commit()
        db.refresh(new_record)

        # Audit Log - pseudonymize IP address before storage
        ip = request.client.host if getattr(request, 'client', None) else None
        if request.headers.get("x-forwarded-for"):
            ip = request.headers.get("x-forwarded-for").split(",")[0]

        masked_ip = None
        try:
            if ip and settings.ENCRYPTION_KEY:
                masked_ip = hmac.new(settings.ENCRYPTION_KEY.encode(), ip.encode(), hashlib.sha256).hexdigest()
        except Exception:
            masked_ip = None

        audit = AuditLog(
            user_id=str(current_user.id),
            target_id=str(new_record.id),
            action="CREATE_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address=masked_ip
        )
        db.add(audit)
        db.commit()

        return new_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to save record: {str(e)}")


@router.get("/", response_model=List[MedicalRecordResponse])
def list_medical_records(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == 'doctor':
        return db.query(MedicalRecord).order_by(MedicalRecord.created_at.desc()).all()
    else:
        return db.query(MedicalRecord).filter(MedicalRecord.patient_id == current_user.id).order_by(MedicalRecord.created_at.desc()).all()
from fastapi import APIRouter, Depends, HTTPException, Header, Request
from pydantic import BaseModel
from typing import Optional
from datetime import date
from jose import jwt, JWTError
from ...core.config import settings
from ...database import get_db
from sqlalchemy.orm import Session
import uuid

from slowapi import Limiter
from slowapi.util import get_remote_address

from ...models.audit_log import AuditLog
from ...models.medical_record import MedicalRecord
from ...models.user import User

# Local limiter for router endpoints (guards this router independently)
limiter = Limiter(key_func=get_remote_address)

router = APIRouter()


class EncryptedBlob(BaseModel):
    cipher_text: str
    iv: str
    version: Optional[str] = "v1"


class MedicalRecordCreate(BaseModel):
    title: str
    # Doctor may be optional at creation
    doctor_id: Optional[str] = None
    # Expect encrypted blobs from the client
    diagnosis: EncryptedBlob
    chief_complaint: Optional[EncryptedBlob] = None
    date: Optional[date] = None
    file_url: Optional[str] = None


def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> User:
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
        payload = jwt.decode(token, settings.PUBLIC_KEY, algorithms=["RS256"])
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        return str(sub)
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


@router.post("/", status_code=201)
@limiter.limit("10/minute")
def create_medical_record(payload: MedicalRecordCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db), request: Request = None):
    # Only patients may create records for themselves via this endpoint
    if getattr(current_user, 'role', 'patient') != 'patient':
        raise HTTPException(status_code=403, detail="Only patients may create records via this endpoint")

    # If a doctor_id was provided, verify it references a real user
    if payload.doctor_id:
        doctor = db.query(User).filter_by(id=payload.doctor_id).first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Provided doctor_id does not reference a valid user")

    try:
        # Store the encrypted blobs as-is (server does NOT attempt to decrypt)
        # Build FHIR Observation wrapper
        fhir_obs = {
            "resourceType": "Observation",
            "id": str(uuid.uuid4()),
            "status": "final",
            "effectiveDateTime": (payload.date.isoformat() if getattr(payload, 'date', None) else datetime.utcnow().isoformat()),
            "subject": {"reference": f"Patient/{current_user.id}"},
            "performer": ([{"reference": f"Practitioner/{payload.doctor_id}"}] if payload.doctor_id else []),
            "extension": [
                {"url": "http://smartcare.local/EncryptedPayload", "valueString": payload.diagnosis.cipher_text}
            ]
        }

        mr = MedicalRecord(
            patient_id=str(current_user.id),
            doctor_id=payload.doctor_id,
            title=payload.title,
            diagnosis=payload.diagnosis.dict(),
            notes={"file_url": payload.file_url} if payload.file_url else None,
            fhir_observation=fhir_obs,
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

        masked_ip = None
        try:
            if ip and settings.ENCRYPTION_KEY:
                masked_ip = hmac.new(settings.ENCRYPTION_KEY.encode(), ip.encode(), hashlib.sha256).hexdigest()
        except Exception:
            masked_ip = None

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=str(current_user.id),
            target_id=str(mr.id),
            action="ACCESS_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address=masked_ip,
        )
        db.add(audit)
        db.commit()
    except Exception:
        try:
            db.rollback()
        except Exception:
            pass

    # Return stored blobs untouched so the client (with master key) can decrypt
    return {
        "id": str(mr.id),
        "patient_id": mr.patient_id,
        "record_type": mr.title,
        "diagnosis": mr.diagnosis,
        "notes": mr.notes,
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

        masked_ip = None
        try:
            if ip and settings.ENCRYPTION_KEY:
                masked_ip = hmac.new(settings.ENCRYPTION_KEY.encode(), ip.encode(), hashlib.sha256).hexdigest()
        except Exception:
            masked_ip = None

        audit = AuditLog(
            id=str(uuid.uuid4()),
            user_id=str(current_user.id),
            target_id=str(current_user.id),
            action="ACCESS_RECORD",
            resource_type="MEDICAL_RECORD",
            ip_address=masked_ip,
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
        result.append({
            "id": str(r.id),
            "patient_id": r.patient_id,
            "record_type": r.title,
            "diagnosis": r.diagnosis,
            "notes": r.notes,
            "created_at": r.created_at.isoformat() if r.created_at is not None else None,
        })
    return result
