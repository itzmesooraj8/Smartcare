# app/crud/crud_medical_record.py
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from app.models.medical_record import MedicalRecord
from app.models.file import File
from app.schemas.medical_record import MedicalRecordCreate, MedicalRecordUpdate

def create_record(db: Session, *, data: MedicalRecordCreate, doctor_id: Optional[str] = None):
    record = MedicalRecord(
        patient_id=data.patient_id,
        doctor_id=doctor_id,
        record_type=data.record_type,
        title=data.title,
        summary=data.summary,
        notes=data.notes,
        private=data.private,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def get_record(db: Session, record_id: str):
    return db.query(MedicalRecord).filter(MedicalRecord.id == record_id).first()

def list_records_for_patient(db: Session, patient_id: str, limit: int = 50, offset: int = 0):
    q = db.query(MedicalRecord).filter(MedicalRecord.patient_id == patient_id).order_by(MedicalRecord.created_at.desc())
    return q.offset(offset).limit(limit).all()

def update_record(db: Session, record: MedicalRecord, patch: MedicalRecordUpdate):
    for field, value in patch.dict(exclude_unset=True).items():
        setattr(record, field, value)
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

def delete_record(db: Session, record: MedicalRecord):
    db.delete(record)
    db.commit()
    return True

def add_file(db: Session, record: MedicalRecord, *, storage_key: str, filename: str = None, mimetype: str = None, size_bytes: int = None):
    f = File(record_id=record.id, storage_key=storage_key, filename=filename, mimetype=mimetype, size_bytes=size_bytes)
    db.add(f)
    db.commit()
    db.refresh(f)
    return f
