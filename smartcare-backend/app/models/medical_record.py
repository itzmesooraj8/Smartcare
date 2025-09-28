# app/models/medical_record.py
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class MedicalRecord(Base):
    __tablename__ = "medical_records"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    patient_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    doctor_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    record_type = sa.Column(sa.String, nullable=False)
    summary = sa.Column(sa.Text, nullable=False)
    notes = sa.Column(sa.Text, nullable=True)
    private = sa.Column(sa.Boolean, default=True, nullable=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    # relationships omitted for brevity
