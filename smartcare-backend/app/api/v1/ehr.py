# app/api/v1/ehr.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordOut, MedicalRecordUpdate
from app import crud
from app.crud.crud_medical_record import create_record, get_record, list_records_for_patient, update_record, delete_record, add_file
from app.services.storage import create_presigned_put_key, create_presigned_get_key
from app.core.deps import get_current_user
from app.models.user import UserRole, User
from app.core.roles import require_role
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordOut
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.medical_record import MedicalRecord
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordOut
from app.models.file import File

router = APIRouter()  # ✅ This is a router, not the app

@router.post("/", response_model=MedicalRecordOut)
def create_medical_record(record: MedicalRecordCreate, db: Session = Depends(get_db)):
    new_record = MedicalRecord(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record

router = APIRouter()

@router.post("/ehr/", response_model=MedicalRecordOut)
def create_medical_record(record: MedicalRecordCreate, db: Session = Depends(get_db)):
    new_record = MedicalRecord(**record.dict())
    db.add(new_record)
    db.commit()
    db.refresh(new_record)
    return new_record
from fastapi import APIRouter, Depends, HTTPException, status, Body
import uuid, os

router = APIRouter(prefix="/api/v1/ehr", tags=["EHR"])

# Helper: check access
def assert_can_view_record(current_user: User, record):
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    if current_user.role == UserRole.admin:
        return True
    # Patients can view own records
    if current_user.role == UserRole.patient and str(current_user.id) == str(record.patient_id):
        return True
    # Doctors can view if they are the author or if allowed (here we allow author)
    if current_user.role == UserRole.doctor and (str(current_user.id) == str(record.doctor_id)):
        return True
    # otherwise forbidden
    raise HTTPException(status_code=403, detail="Not allowed to view this record")

@router.post("/", response_model=MedicalRecordOut)
def create_medical_record(payload: MedicalRecordCreate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.doctor]))):
    # Only doctors create records in this flow. You could allow admins or other services too.
    record = create_record(db, data=payload, doctor_id=str(current_user.id))
    return record

@router.get("/patient/{patient_id}", response_model=List[MedicalRecordOut])
def list_patient_records(patient_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    # patients see their own records; doctors see records for their patients; admins see all
    if current_user.role == UserRole.patient and str(current_user.id) != str(patient_id):
        raise HTTPException(status_code=403)
    # doctors: here you may check relationship (assigned patients); assuming doctor can view any patient via business rule is not safe
    records = list_records_for_patient(db, patient_id)
    # filter private flag: if patient or doctor or admin ok; otherwise exclude private
    if current_user.role == UserRole.patient:
        return records
    if current_user.role == UserRole.doctor or current_user.role == UserRole.admin:
        return records
    return []  # no other roles allowed

@router.get("/{record_id}", response_model=MedicalRecordOut)
def get_record_detail(record_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = get_record(db, record_id)
    assert_can_view_record(current_user, record)
    return record

@router.patch("/{record_id}", response_model=MedicalRecordOut)
def patch_record(record_id: str, payload: MedicalRecordUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.doctor, UserRole.admin]))):
    record = get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404)
    # Only authoring doctor or admin allowed to update
    if current_user.role == UserRole.doctor and str(record.doctor_id) != str(current_user.id):
        raise HTTPException(status_code=403)
    return update_record(db, record, payload)

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_record(record_id: str, db: Session = Depends(get_db), current_user: User = Depends(require_role([UserRole.admin, UserRole.doctor]))):
    record = get_record(db, record_id)
    if not record:
        raise HTTPException(status_code=404)
    if current_user.role == UserRole.doctor and str(record.doctor_id) != str(current_user.id):
        raise HTTPException(status_code=403)
    delete_record(db, record)
    return

# --- File upload flow (presign + confirm) ---

from pydantic import BaseModel

class PresignRequest(BaseModel):
    # define your fields here, for example:
    key: str
    pass

@router.post("/{record_id}/files/presign")
def presign_upload(record_id: str, filename: str = Body(...), mimetype: str = Body(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = get_record(db, record_id)
    assert_can_view_record(current_user, record)  # only allowed if you can view the record
    # generate a storage key
    ext = os.path.splitext(filename)[1]
    key = f"records/{record_id}/{uuid.uuid4()}{ext}"
    put_url = create_presigned_put_key(key)
    return {"upload_url": put_url, "object_key": key}

@router.post("/{record_id}/files/confirm")
def confirm_upload(record_id: str, object_key: str = Body(...), filename: str = Body(None), mimetype: str = Body(None), size_bytes: int = Body(None), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    record = get_record(db, record_id)
    assert_can_view_record(current_user, record)
    file_obj = add_file(db, record, storage_key=object_key, filename=filename, mimetype=mimetype, size_bytes=size_bytes)
    return {"file": file_obj}

@router.get("/files/{file_id}/download")
def download_file(file_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    file_obj = db.query(File).filter_by(id=file_id).first()

    if not file_obj:
        raise HTTPException(status_code=404)
    record = get_record(db, file_obj.record_id)
    assert_can_view_record(current_user, record)
    url = create_presigned_get_key(file_obj.storage_key)
    return {"url": url}
