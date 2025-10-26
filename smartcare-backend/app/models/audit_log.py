# app/models/audit_log.py
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True, index=True)
    action = sa.Column(sa.String, nullable=False)
    target_type = sa.Column(sa.String, nullable=True)
    target_id = sa.Column(UUID(as_uuid=True), nullable=True)
    details = sa.Column(sa.JSON, nullable=True)
    ip = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
