# app/models/doctor_profile.py
import uuid
import sqlalchemy as sa
from sqlalchemy import JSON
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class DoctorProfile(Base):
    __tablename__ = "doctor_profiles"
    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    specialty = sa.Column(sa.String, index=True)
    qualification = sa.Column(sa.String)
    experience_years = sa.Column(sa.Integer)
    bio = sa.Column(sa.Text)
    clinic_address = sa.Column(sa.Text)
    consultation_fee = sa.Column(sa.Numeric(10,2))
    languages = sa.Column(JSON, nullable=True)
    ratings_avg = sa.Column(sa.Float, default=0.0)
    ratings_count = sa.Column(sa.Integer, default=0)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    user = relationship("User", back_populates="doctor_profile")
