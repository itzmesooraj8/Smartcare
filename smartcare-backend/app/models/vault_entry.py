import uuid
import sqlalchemy as sa
from sqlalchemy.orm import relationship
from app.database import Base

class VaultEntry(Base):
    __tablename__ = "vault_entries"
    __table_args__ = {"extend_existing": True}

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id"), nullable=False, index=True)
    encrypted_master_key = sa.Column(sa.String, nullable=False)
    key_encryption_iv = sa.Column(sa.String, nullable=True)
    key_derivation_salt = sa.Column(sa.String, nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())

    user = relationship("User", foreign_keys=[user_id])
