# notification.py
# Define your Notification model here
from app.db.base_class import Base
from sqlalchemy import Column, Integer, String, Boolean

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)
    message = Column(String, nullable=False)
    is_read = Column(Boolean, default=False)
