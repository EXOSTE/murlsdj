from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from app.database import Base


class RateLimit(Base):
    __tablename__ = "rate_limits"

    id = Column(String(255), primary_key=True)  # "{action}:{ip}"
    count = Column(Integer, nullable=False, default=1)
    window_start = Column(DateTime, nullable=False, default=datetime.utcnow)
