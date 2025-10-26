# app/models/refresh_token.py
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = sa.Column(sa.String, nullable=False)
    expires_at = sa.Column(sa.DateTime(timezone=True), nullable=False)
    revoked = sa.Column(sa.Boolean, default=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
