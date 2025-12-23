# app/models/notification.py
import uuid
import sqlalchemy as sa

from app.db.base_class import Base

class Notification(Base):
    __tablename__ = "notifications"
    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = sa.Column(sa.String, nullable=False)  # email, sms, push
    payload = sa.Column(sa.JSON, nullable=True)
    status = sa.Column(sa.String, default="queued")  # queued, sent, failed
    attempts = sa.Column(sa.Integer, default=0)
    scheduled_for = sa.Column(sa.DateTime(timezone=True), nullable=True)
    sent_at = sa.Column(sa.DateTime(timezone=True), nullable=True)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
