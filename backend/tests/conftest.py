"""
Pytest configuration and shared fixtures for Mur LSDJ backend tests.

Strategy:
- Set DATABASE_URL to SQLite in-memory BEFORE importing any app module.
- Patch SQLAlchemy Enum to use native_enum=False (SQLite has no native enum type).
- The app modules (database.py, main.py) will pick up the patched settings.
- Override get_db to use the test session so every request hits the in-memory DB.
- Mock cloudinary upload_file so tests never hit the real Cloudinary API.
"""
import os

# ── 1. Set environment variables BEFORE any app import ────────────────────────
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["ADMIN_SECRET"] = "test-admin-secret"
os.environ["CONTRIBUTION_TOKEN"] = "test-contrib-token"
os.environ["CLOUDINARY_CLOUD_NAME"] = "test-cloud"
os.environ["CLOUDINARY_API_KEY"] = "test-key"
os.environ["CLOUDINARY_API_SECRET"] = "test-secret"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:5173"
os.environ["MAX_UPLOAD_SIZE_MB"] = "100"

# ── 2. Patch SQLAlchemy Enum to avoid PostgreSQL-specific native enum types ────
# SQLite does not support native enum types; using native_enum=False makes
# SQLAlchemy store enum values as VARCHAR instead.
import sqlalchemy as _sa

_orig_enum_init = _sa.Enum.__init__


def _patched_enum_init(self, *enums, **kw):
    kw.setdefault("native_enum", False)
    _orig_enum_init(self, *enums, **kw)


_sa.Enum.__init__ = _patched_enum_init

# ── 3. Now patch app.config BEFORE it is used to build the engine ─────────────
# config.py is imported by database.py; we must set DATABASE_URL on the
# settings object before database.py's create_engine() runs.
from app.config import settings as _settings  # noqa: E402

_settings.DATABASE_URL = "sqlite:///:memory:"

# ── 4. Import app.database so we can replace its engine/session with SQLite ───
import app.database as _db_module  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402

from sqlalchemy.pool import StaticPool  # noqa: E402

_test_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
_TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_test_engine)

# Replace the module-level engine and SessionLocal used by the app
_db_module.engine = _test_engine
_db_module.SessionLocal = _TestSessionLocal

# ── 5. Import models so they register on Base.metadata, then create tables ────
from app.database import Base  # noqa: E402

# Import every model to register it on Base metadata
from app.models.media import Media  # noqa: F401, E402
from app.models.comment import Comment  # noqa: F401, E402
from app.models.settings import Setting  # noqa: F401, E402

Base.metadata.create_all(bind=_test_engine)

# ── 6. Import the FastAPI app (main.py) ───────────────────────────────────────
# main.py will try to run create_all and ALTER TABLE statements, but since
# engine is now SQLite those will either succeed quietly or be caught by the
# existing try/except blocks in main.py.
import app.main  # noqa: F401, E402 — side-effects: routers registered

# ── 7. Pytest fixtures ────────────────────────────────────────────────────────
import pytest  # noqa: E402
from unittest.mock import AsyncMock, patch  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from app.main import app  # noqa: E402
from app.database import get_db  # noqa: E402


def _override_get_db():
    """Yield a test SQLite session for every FastAPI request."""
    db = _TestSessionLocal()
    try:
        yield db
    finally:
        db.close()


# Apply the DB override globally (affects all test functions)
app.dependency_overrides[get_db] = _override_get_db

_MOCK_UPLOAD = {
    "file_url": "https://res.cloudinary.com/test-cloud/image/upload/test.jpg",
    "thumbnail_url": "https://res.cloudinary.com/test-cloud/image/upload/w_600/test.jpg",
    "public_id": "mur-lsdj/test",
}


@pytest.fixture(scope="session")
def client():
    """
    Session-scoped FastAPI TestClient backed by SQLite in-memory.
    Cloudinary upload_file is mocked so no real HTTP call is made.
    """
    with patch(
        "app.services.cloudinary_service.upload_file",
        new=AsyncMock(return_value=_MOCK_UPLOAD),
    ):
        with TestClient(app) as c:
            yield c


@pytest.fixture()
def db_session():
    """Function-scoped DB session for direct DB access in tests."""
    db = _TestSessionLocal()
    try:
        yield db
    finally:
        db.close()
