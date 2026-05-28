from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.rate_limit import RateLimit


def is_allowed(db: Session, action: str, ip: str, limit: int, window_seconds: int) -> bool:
    key = f"{action}:{ip}"
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)

    record = db.query(RateLimit).filter(RateLimit.id == key).first()

    if record is None:
        db.add(RateLimit(id=key, count=1, window_start=now))
        db.commit()
        return True

    if record.window_start < window_start:
        record.count = 1
        record.window_start = now
        db.commit()
        return True

    if record.count >= limit:
        return False

    record.count += 1
    db.commit()
    return True
