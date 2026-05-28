from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import media, admin, comments
from app.database import Base, engine
# Import models to ensure they are registered on the Base metadata
from app.models.media import Media
from app.models.comment import Comment
from app.models.settings import Setting

# Create database tables automatically
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"Warning: Database initialization failed: {e}")

# Migrations inline pour les colonnes ajoutées après la création initiale
from sqlalchemy import text
_new_columns = [
    ("media", "uploaded_by", "VARCHAR(255)"),
    ("media", "likes", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "reposts", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "shares", "INTEGER NOT NULL DEFAULT 0"),
    ("media", "reports", "INTEGER NOT NULL DEFAULT 0"),
]
try:
    with engine.connect() as _conn:
        for _table, _col, _definition in _new_columns:
            try:
                _conn.execute(text(f"ALTER TABLE {_table} ADD COLUMN {_col} {_definition}"))
                _conn.commit()
            except Exception:
                pass  # Colonne déjà existante
except Exception as e:
    print(f"Warning: Migration failed: {e}")

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
