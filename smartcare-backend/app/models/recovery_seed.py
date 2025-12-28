from __future__ import annotations
from typing import Optional
import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database import Base
from sqlalchemy.sql import func


class RecoverySeed(Base):
    __tablename__ = "recovery_seeds"
    __table_args__ = {"extend_existing": True}

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    seed_hash = sa.Column(sa.String, nullable=False)
    used = sa.Column(sa.Boolean, default=False, nullable=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="recovery_seeds")
