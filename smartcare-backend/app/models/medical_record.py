import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
# FIX: Import Base from your active database.py
from app.database import Base


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    doctor_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=True)

    title = sa.Column(sa.String, nullable=False)
    diagnosis = sa.Column(sa.Text, nullable=False)
    # Mapping 'summary' to diagnosis for simple dashboard display if needed

    visit_date = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())
