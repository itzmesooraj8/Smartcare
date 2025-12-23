# app/models/refresh_token.py
import uuid
import sqlalchemy as sa

from app.db.base_class import Base

class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token_hash = sa.Column(sa.String, nullable=False)
    expires_at = sa.Column(sa.DateTime(timezone=True), nullable=False)
    revoked = sa.Column(sa.Boolean, default=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
