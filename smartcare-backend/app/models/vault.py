"""
Vault (KeyMetadata) model

Design: store wrapped/encrypted master keys and metadata in an isolated table
separate from the `users` table. This reduces blast radius if authentication
flows are compromised and allows RLS policies to be enforced at the DB level.
"""
import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database import Base


class KeyMetadata(Base):
    __tablename__ = "vault_keys"
    __table_args__ = {"extend_existing": True}

    # Use UUID string primary key to avoid integer-based enumeration attacks.
    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))

    # Owner relationship (string UUID) — kept as string for flexibility.
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)

    # The wrapped master key (BASE64). This is treated as secret material and
    # access should be restricted via application logic + DB RLS policies.
    wrapped_key = sa.Column(sa.String, nullable=False)

    # Additional cryptographic metadata stored for client-side unwrapping.
    key_iv = sa.Column(sa.String, nullable=True)
    key_salt = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())

    # Relationship helper for convenience. Do not rely on ORM to leak secrets.
    user = relationship("User", foreign_keys=[user_id])
