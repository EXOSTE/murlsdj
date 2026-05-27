import enum
import uuid
from sqlalchemy import Column, String, Text, Date, Integer, Enum, DateTime, func, Uuid
from app.database import Base


class MediaType(str, enum.Enum):
    photo = "photo"
    video = "video"


class MediaStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Media(Base):
    __tablename__ = "media"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    file_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    type = Column(Enum(MediaType), nullable=False)
    legende = Column(Text, nullable=True)
    date_prise = Column(Date, nullable=True)
    annee = Column(Integer, nullable=True)
    status = Column(Enum(MediaStatus), nullable=False, default=MediaStatus.pending)
    uploaded_at = Column(DateTime, server_default=func.now())
    approved_at = Column(DateTime, nullable=True)
    uploaded_by = Column(String(255), nullable=True)
    raison_rejet = Column(Text, nullable=True)
    likes = Column(Integer, nullable=False, default=0, server_default="0")
    reposts = Column(Integer, nullable=False, default=0, server_default="0")
    shares = Column(Integer, nullable=False, default=0, server_default="0")
    reports = Column(Integer, nullable=False, default=0, server_default="0")
