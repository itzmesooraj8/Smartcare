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
    # GDPR: deactivated_at indicates when the record was deactivated for right-to-forget
    deactivated_at = sa.Column(sa.DateTime(timezone=True), nullable=True)

    # ORM relationships
    patient = relationship("User", foreign_keys=[patient_id], back_populates="medical_records")
    doctor = relationship("User", foreign_keys=[doctor_id], back_populates="doctor_appointments")

    @classmethod
    def hard_delete(cls, db, record_id: str, pseudonymize_key: str | None = None):
        """Pseudonymize PHI in related audit logs and remove the primary record.

        This method will replace references in AuditLog.target_id with an HMAC-derived
        pseudonym and then delete the medical record row. Use with caution — this is
        intended for GDPR Right-To-Be-Forgotten workflows executed by an administrator.
        """
        import hmac, hashlib
        from datetime import datetime
        from app.models.audit_log import AuditLog

        rec = db.query(cls).filter(cls.id == record_id).first()
        if not rec:
            return False

        # Pseudonymize audit references
        if pseudonymize_key:
            try:
                pseud = hmac.new(pseudonymize_key.encode(), record_id.encode(), hashlib.sha256).hexdigest()
                db.query(AuditLog).filter(AuditLog.target_id == record_id).update({"target_id": pseud})
            except Exception:
                pass

        # Attempt to scrub sensitive fields before deletion
        try:
            rec.chief_complaint = None
            rec.diagnosis = None
            rec.notes = None
            rec.value_string = None
            rec.fhir_observation = None
            rec.deactivated_at = datetime.utcnow()
            db.add(rec)
            db.commit()
        except Exception:
            db.rollback()

        try:
            db.delete(rec)
            db.commit()
            return True
        except Exception:
            db.rollback()
            return False