from sqlalchemy import Boolean, Column, String, DateTime
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
    # Encrypted master key blob produced by the client (Base64)
    encrypted_master_key = Column(String, nullable=True)
    # IV used to encrypt the master key (Base64)
    key_encryption_iv = Column(String, nullable=True)
    # Salt used during client-side PBKDF2 derivation (Base64)
    key_derivation_salt = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
