import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"
    __table_args__ = {"extend_existing": True}

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Patient is required (string UUID)
    patient_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    # Doctor is optional (string UUID)
    doctor_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True, index=True)

    # SECURE FIELDS: Stored as JSON blobs { "cipher_text": "...", "iv": "..." }
    chief_complaint = sa.Column(sa.JSON, nullable=False)
    diagnosis = sa.Column(sa.JSON, nullable=False)
    notes = sa.Column(sa.JSON, nullable=True)

    # Prefer normalized visit_type values aligning to FHIR 'Encounter.type' systems
    visit_type = sa.Column(sa.String, default="consultation")
    # Effective date/time for the record (FHIR: effectiveDateTime)
    effective_date = sa.Column(sa.String, nullable=True)
    # FHIR-compatible encrypted payloads
    # `value_string` stores base64 or armored encrypted data (client-side encrypted)
    # This aligns with FHIR Observation.valueString usage but stores the encrypted blob.
    value_string = sa.Column(sa.Text, nullable=True)
    # Optional canonical FHIR Observation resource (encrypted or plain JSON depending on deployment)
    fhir_observation = sa.Column(sa.JSON, nullable=True)
    
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    # ORM relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="medical_records")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_appointments")