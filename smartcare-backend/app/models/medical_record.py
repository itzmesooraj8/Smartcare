import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Relationships to users ensure a verifiable author and subject for non-repudiation
    patient_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)

    # Core record fields
    title = sa.Column(sa.String, nullable=False)
    # Stored encrypted as a Fernet token string
    diagnosis = sa.Column(sa.Text, nullable=False)
    # Optional encrypted notes (e.g., file references, doctor comments)
    notes = sa.Column(sa.Text, nullable=True)

    visit_date = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    # ORM relationships for convenient loading
    patient = relationship("User", foreign_keys=[patient_id])
    doctor = relationship("User", foreign_keys=[doctor_id])
