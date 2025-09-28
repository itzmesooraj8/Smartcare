# app/models/user.py
import enum, uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class UserRole(str, enum.Enum):
    patient = "patient"
    doctor = "doctor"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = sa.Column(sa.String(255), unique=True, nullable=False, index=True)
    name = sa.Column(sa.String(255), nullable=True)
    hashed_password = sa.Column(sa.String, nullable=False)
    role = sa.Column(sa.Enum(UserRole), nullable=False, default=UserRole.patient)
    phone = sa.Column(sa.String(32), nullable=True)
    is_active = sa.Column(sa.Boolean, default=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    # relations
    doctor_profile = relationship("DoctorProfile", back_populates="user", uselist=False)
    availabilities = relationship("Availability", back_populates="doctor")
    appointments_as_doctor = relationship("Appointment", back_populates="doctor", foreign_keys="Appointment.doctor_id")
    appointments_as_patient = relationship("Appointment", back_populates="patient", foreign_keys="Appointment.patient_id")
