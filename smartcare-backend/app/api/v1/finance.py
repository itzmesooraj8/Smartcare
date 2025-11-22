from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.core.deps import get_current_user
from app.models.invoice import Invoice, PaymentStatus
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate

router = APIRouter()

@router.post("/", response_model=InvoiceResponse)
def create_invoice(
    invoice_in: InvoiceCreate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Only doctors or admins should probably create invoices, but for now we'll allow authenticated users
    # or restrict based on role if needed.
    # if current_user.role not in ["doctor", "admin"]:
    #     raise HTTPException(status_code=403, detail="Not authorized to create invoices")

    invoice = Invoice(
        amount=invoice_in.amount,
        description=invoice_in.description,
        patient_id=invoice_in.patient_id,
        doctor_id=invoice_in.doctor_id,
        appointment_id=invoice_in.appointment_id,
        status=PaymentStatus.PENDING
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice

@router.get("/", response_model=List[InvoiceResponse])
def get_invoices(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    # Patients see their own invoices
    if current_user.role == "patient":
        return db.query(Invoice).filter(Invoice.patient_id == current_user.id).offset(skip).limit(limit).all()
    
    # Doctors see invoices related to them
    if current_user.role == "doctor":
        return db.query(Invoice).filter(Invoice.doctor_id == current_user.id).offset(skip).limit(limit).all()
        
    # Admins see all
    if current_user.role == "admin":
        return db.query(Invoice).offset(skip).limit(limit).all()

    return []

@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: str, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    # Access control
    if current_user.role == "patient" and invoice.patient_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role == "doctor" and invoice.doctor_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    return invoice

@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice_status(
    invoice_id: str, 
    invoice_update: InvoiceUpdate, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Only allow doctors/admins to update status (e.g. mark as paid)
    if current_user.role not in ["doctor", "admin"]:
         raise HTTPException(status_code=403, detail="Not authorized to update invoices")

    if invoice_update.status:
        invoice.status = invoice_update.status
    if invoice_update.description:
        invoice.description = invoice_update.description
        
    db.commit()
    db.refresh(invoice)
    return invoice
