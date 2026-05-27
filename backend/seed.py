"""Lance ce script une seule fois pour initialiser les tokens en base."""
import uuid
import sys
import os

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app.models.settings import Setting
import app.models.media  # noqa
import app.models.comment  # noqa

Base.metadata.create_all(bind=engine)

db = SessionLocal()


def upsert(key: str, value: str):
    setting = db.query(Setting).filter(Setting.key == key).first()
    if setting:
        print(f"[existant] {key} = {setting.value}")
    else:
        db.add(Setting(key=key, value=value))
        print(f"[créé]    {key} = {value}")


contribution_token = str(uuid.uuid4())
admin_secret = str(uuid.uuid4())

upsert("contribution_token", contribution_token)
upsert("admin_secret", admin_secret)

db.commit()
db.close()

print("\n[OK] Base initialisee.")
print(f"\nLien contribution : http://localhost:5173/contribuer?token={contribution_token}")
print(f"Lien admin        : http://localhost:5173/admin?secret={admin_secret}")
