"""
Tests for the /api/admin routes — authentication and access control.
"""
import pytest


ADMIN_SECRET = "test-admin-secret"  # Must match os.environ["ADMIN_SECRET"] in conftest.py


# ── Authentication guard ───────────────────────────────────────────────────────

def test_get_pending_no_auth_returns_403(client):
    """GET /api/admin/pending without any auth header must return 403."""
    resp = client.get("/api/admin/pending")
    assert resp.status_code == 403
    assert "refus" in resp.json()["detail"].lower()


def test_get_pending_wrong_secret_returns_403(client):
    """GET /api/admin/pending with wrong X-Admin-Secret must return 403."""
    resp = client.get(
        "/api/admin/pending",
        headers={"X-Admin-Secret": "totally-wrong-secret"},
    )
    assert resp.status_code == 403


def test_get_pending_correct_secret_returns_200(client, db_session):
    """
    GET /api/admin/pending with correct X-Admin-Secret must return 200
    with a list (possibly empty).
    """
    # Seed the ADMIN_SECRET into the settings table so token_service finds it
    from app.models.settings import Setting

    existing = db_session.query(Setting).filter(Setting.key == "admin_secret").first()
    if not existing:
        db_session.add(Setting(key="admin_secret", value=ADMIN_SECRET))
        db_session.commit()

    resp = client.get(
        "/api/admin/pending",
        headers={"X-Admin-Secret": ADMIN_SECRET},
    )
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


def test_get_pending_returns_only_pending_items(client, db_session):
    """
    /api/admin/pending must return only media with status=pending,
    not approved or rejected ones.
    """
    from datetime import timezone, datetime
    from app.models.media import Media, MediaStatus, MediaType
    from app.models.settings import Setting

    # Ensure admin secret is in DB
    existing = db_session.query(Setting).filter(Setting.key == "admin_secret").first()
    if not existing:
        db_session.add(Setting(key="admin_secret", value=ADMIN_SECRET))

    pending = Media(
        file_url="text://Anonyme",
        type=MediaType.photo,
        legende="En attente de modération",
        status=MediaStatus.pending,
    )
    approved = Media(
        file_url="text://Anonyme",
        type=MediaType.photo,
        legende="Déjà approuvé",
        status=MediaStatus.approved,
        approved_at=datetime.now(timezone.utc),
    )
    db_session.add_all([pending, approved])
    db_session.commit()

    resp = client.get(
        "/api/admin/pending",
        headers={"X-Admin-Secret": ADMIN_SECRET},
    )
    assert resp.status_code == 200
    items = resp.json()
    statuses = {item["status"] for item in items}
    # Only pending items should appear
    assert statuses <= {"pending"}
    legendes = [item["legende"] for item in items]
    assert "En attente de modération" in legendes
    assert "Déjà approuvé" not in legendes
