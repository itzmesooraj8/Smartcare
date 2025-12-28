from sqlalchemy import Boolean, Column, String, DateTime
from sqlalchemy import Integer
from sqlalchemy.sql import func
from app.database import Base
import uuid


class User(Base):
    __tablename__ = "users"
    __table_args__ = {"extend_existing": True}
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)

    # --- Zero-Knowledge Key Storage ---
    # NOTE: Encrypted master key material has been moved to a separate
    # `vault_entries` table to isolate key material from primary auth flows.
    # This reduces the risk of accidental exposure during authentication.

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # TOTP secret for MFA (stored server-side encrypted in production)
    mfa_totp_secret = Column(String, nullable=True)
    # Allow a small MFA grace-count for privileged users to enable MFA without immediate lockout
    mfa_grace_count = Column(Integer, default=0, nullable=False)
