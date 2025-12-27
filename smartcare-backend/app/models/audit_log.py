import uuid
import sqlalchemy as sa
from app.database import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"
    __table_args__ = {"extend_existing": True}

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    target_id = sa.Column(sa.String, nullable=True, index=True)
    action = sa.Column(sa.String, nullable=False)
    resource_type = sa.Column(sa.String, nullable=False)
    ip_address = sa.Column(sa.String, nullable=True)
    timestamp = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False)
