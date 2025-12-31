from sqlalchemy import Column, String, Integer, ForeignKey, Date, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String, nullable=True)
    blood_group = Column(String, nullable=True)
    emergency_contact = Column(JSON, nullable=True) # {"name": "...", "phone": "..."}
    medical_history_summary = Column(Text, nullable=True)

    # Relationship to User
    user = relationship("User", backref="patient_profile")
