from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.database import Base
import uuid
from datetime import datetime


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)

    # Record Details
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    doctor_name = Column(String, nullable=True)

    date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 👇 THIS CONNECTS BACK TO THE USER 👇
    patient = relationship("User", back_populates="medical_records")