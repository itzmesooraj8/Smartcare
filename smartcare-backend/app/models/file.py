# app/models/file.py
import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from app.db.base_class import Base

class File(Base):
    __tablename__ = "files"
    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    record_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("medical_records.id", ondelete="CASCADE"), nullable=False, index=True)
    storage_key = sa.Column(sa.String, nullable=False)  # S3/MinIO key
    filename = sa.Column(sa.String, nullable=True)
    mimetype = sa.Column(sa.String, nullable=True)
    size_bytes = sa.Column(sa.BigInteger, nullable=True)
    is_encrypted = sa.Column(sa.Boolean, default=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
