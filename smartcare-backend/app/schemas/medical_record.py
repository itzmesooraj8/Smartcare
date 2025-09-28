# app/schemas/medical_record.py
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class FileOut(BaseModel):
    id: str
    filename: Optional[str]
    mimetype: Optional[str]
    size_bytes: Optional[int]
    storage_key: str
    created_at: datetime

    class Config:
        orm_mode = True

class MedicalRecordCreate(BaseModel):
    patient_id: str
    record_type: str = Field(..., example="consultation")
    title: Optional[str]
    summary: Optional[str]
    notes: Optional[str]
    private: bool = True

class MedicalRecordUpdate(BaseModel):
    title: Optional[str]
    summary: Optional[str]
    notes: Optional[str]
    private: Optional[bool]

class MedicalRecordOut(BaseModel):
    id: str
    patient_id: str
    doctor_id: Optional[str]
    record_type: str
    title: Optional[str]
    summary: Optional[str]
    notes: Optional[str]
    private: bool
    created_at: datetime
    updated_at: Optional[datetime]
    files: List[FileOut] = []

    class Config:
        orm_mode = True
