# app/models/appointment.py
import uuid, enum
import sqlalchemy as sa

from sqlalchemy.orm import relationship
from app.db.base_class import Base

class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"

class Appointment(Base):
    __tablename__ = "appointments"
    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    doctor_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_id = sa.Column(sa.String, sa.ForeignKey("availabilities.id", ondelete="SET NULL"), nullable=True, index=True)
    appointment_time = sa.Column(sa.DateTime(timezone=True), nullable=False, index=True)
    status = sa.Column(sa.Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.booked)
    reason = sa.Column(sa.Text, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())
    cancelled_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="appointments_as_doctor")
    patient = relationship("User", foreign_keys=[patient_id], back_populates="appointments_as_patient")
    slot = relationship("Availability")
