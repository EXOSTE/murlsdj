import os
from sqlalchemy.orm import Session
from app.models.settings import Setting


def get_setting(db: Session, key: str) -> str | None:
    # 1. Lecture de la DB avec try/except robuste
    try:
        setting = db.query(Setting).filter(Setting.key == key).first()
        if setting:
            return setting.value
    except Exception as e:
        print(f"Database setting fetch warning: {e}")

    # 2. Recherche dans les variables d'environnement (ex: ADMIN_SECRET, CONTRIBUTION_TOKEN)
    env_val = os.environ.get(key.upper())
    if env_val:
        return env_val

    return None


def verify_contribution_token(db: Session, token: str) -> bool:
    stored = get_setting(db, "contribution_token")
    return bool(stored and token == stored)


def verify_admin_secret(db: Session, secret: str) -> bool:
    stored = get_setting(db, "admin_secret")
    return bool(stored and secret == stored)
