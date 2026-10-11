import uuid
import sqlalchemy as sa
from app.database import Base


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = ({"extend_existing": True},)

    id = sa.Column(sa.String, primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = sa.Column(sa.String, sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    room_id = sa.Column(sa.String, nullable=True, index=True)
    text = sa.Column(sa.Text, nullable=False)
    is_read = sa.Column(sa.Boolean, default=False)
    created_at = sa.Column(sa.DateTime(timezone=True), server_default=sa.func.now())
