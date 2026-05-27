from sqlalchemy.orm import Session
from app.models.settings import Setting


def get_setting(db: Session, key: str) -> str | None:
    setting = db.query(Setting).filter(Setting.key == key).first()
    return setting.value if setting else None


def verify_contribution_token(db: Session, token: str) -> bool:
    stored = get_setting(db, "contribution_token")
    return bool(stored and token == stored)


def verify_admin_secret(db: Session, secret: str) -> bool:
    stored = get_setting(db, "admin_secret")
    return bool(stored and secret == stored)
