import uuid
from sqlalchemy import Column, String, Text, Boolean, DateTime, ForeignKey, func, Uuid
from app.database import Base


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    media_id = Column(Uuid, ForeignKey("media.id", ondelete="CASCADE"), nullable=False)
    author = Column(String(100), nullable=False)
    content = Column(Text, nullable=False)
    approved = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, server_default=func.now())
