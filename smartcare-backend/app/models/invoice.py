from sqlalchemy import Column, String, Float, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base_class import Base
import enum
import uuid

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("users.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("users.id"), nullable=True)
    appointment_id = Column(String, ForeignKey("appointments.id"), nullable=True)
    
    amount = Column(Float, nullable=False)
    currency = Column(String, default="USD")
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    description = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    patient = relationship("User", foreign_keys=[patient_id], backref="invoices")
    doctor = relationship("User", foreign_keys=[doctor_id])
    appointment = relationship("Appointment", backref="invoice")
