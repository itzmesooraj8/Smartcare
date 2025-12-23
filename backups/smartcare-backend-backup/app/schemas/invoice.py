from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from app.models.invoice import PaymentStatus

class InvoiceBase(BaseModel):
    amount: float
    description: Optional[str] = None
    patient_id: str
    doctor_id: Optional[str] = None
    appointment_id: Optional[str] = None

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    description: Optional[str] = None

class InvoiceResponse(InvoiceBase):
    id: str
    status: PaymentStatus
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
