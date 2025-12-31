from sqlalchemy import Column, String, Integer, ForeignKey, Float, Text, JSON
from sqlalchemy.orm import relationship
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, nullable=False)
    
    specialization = Column(String, nullable=True)
    license_number = Column(String, nullable=True)
    bio = Column(Text, nullable=True)
    consultation_fee = Column(Float, default=0.0)
    availability = Column(JSON, nullable=True)  # e.g. {"mon": ["09:00", "17:00"]}

    # Relationship to User (for name, email, avatar)
    user = relationship("User", backref="doctor_profile")
