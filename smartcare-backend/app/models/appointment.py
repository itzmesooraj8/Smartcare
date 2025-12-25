import uuid
import enum
import sqlalchemy as sa
from sqlalchemy.orm import relationship
# FIX: Import Base from your active database.py
from app.database import Base


class AppointmentStatus(str, enum.Enum):
    booked = "booked"
    cancelled = "cancelled"
    completed = "completed"
    no_show = "no_show"


class Appointment(Base):
    __tablename__ = "appointments"

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    # Note: We use string user IDs in your setup
    doctor_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)
    patient_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)

    appointment_time = sa.Column(sa.DateTime(timezone=True), nullable=False, index=True)
    status = sa.Column(sa.Enum(AppointmentStatus), nullable=False, default=AppointmentStatus.booked)
    reason = sa.Column(sa.Text, nullable=True)

    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())
