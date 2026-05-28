from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import media, admin, comments
from app.database import Base, engine
# Import models to ensure they are registered on the Base metadata
from app.models.media import Media
from app.models.comment import Comment
from app.models.settings import Setting
from app.models.rate_limit import RateLimit  # noqa — registers table for create_all

# Create database tables automatically
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database initialization failed: {e}")

# Migrations inline (fallback de sécurité) — les migrations officielles sont dans
# backend/alembic/versions/001_initial_schema.py (Alembic).
# Ces ALTER TABLE restent ici comme garde-fou pour les colonnes ajoutées après la
# création initiale de la table, notamment sur les environnements qui n'ont pas encore
# lancé `alembic upgrade head`.
# Chaque colonne est traitée dans sa propre connexion pour éviter que PostgreSQL
# laisse la transaction en état d'erreur après un "column already exists".
from sqlalchemy import text
_new_columns = [
    ("media", "uploaded_by", "VARCHAR(255)"),
    ("media", "likes", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "reposts", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "shares", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "reports", "INTEGER NOT NULL DEFAULT 0"),
]
for _table, _col, _definition in _new_columns:
    try:
        with engine.connect() as _c:
            _c.execute(text(f"ALTER TABLE {_table} ADD COLUMN {_col} {_definition}"))
            _c.commit()
    except Exception:
        pass  # Colonne déjà existante

app = FastAPI(title="Mur LSDJ — Une infinité d'histoires", version="1.0.0")

origins = [o.strip() for o in settings.ALLOWED_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(media.router)
app.include_router(admin.router)
app.include_router(comments.router)


@app.get("/")
def root():
    return {"status": "ok", "project": "Mur LSDJ"}
