# app/models/availability.py
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.base_class import Base

class Availability(Base):
    __tablename__ = "availabilities"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doctor_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    slot_start = sa.Column(sa.DateTime(timezone=True), nullable=False, index=True)
    slot_end = sa.Column(sa.DateTime(timezone=True), nullable=False)
    is_booked = sa.Column(sa.Boolean, default=False, index=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
    updated_at = sa.Column(sa.DateTime(timezone=True), onupdate=sa.func.now())

    doctor = relationship("User", back_populates="availabilities")
