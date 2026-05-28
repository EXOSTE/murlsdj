"""
Tests for the /api/media routes and the root health endpoint.
"""
import pytest


# ── Health check ──────────────────────────────────────────────────────────────

def test_root_ok(client):
    """GET / must return {status: 'ok'}."""
    resp = client.get("/")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"


# ── Upload validation ─────────────────────────────────────────────────────────

def test_upload_rgpd_false_returns_400(client):
    """POST /api/media/upload with rgpd_ok=false must be rejected with 400."""
    resp = client.post(
        "/api/media/upload",
        data={"rgpd_ok": "false", "legende": "Test légende"},
    )
    assert resp.status_code == 400
    assert "conditions" in resp.json()["detail"].lower()


def test_upload_no_file_no_legende_returns_400(client):
    """POST /api/media/upload without file and without legende must return 400."""
    resp = client.post(
        "/api/media/upload",
        data={"rgpd_ok": "true"},
    )
    assert resp.status_code == 400


def test_upload_text_only_returns_200_and_pending(client, db_session):
    """
    POST /api/media/upload with legende + rgpd_ok=true (no file)
    must succeed and create a media record in 'pending' status.
    """
    from app.models.media import Media, MediaStatus

    legende = "Souvenir de 1994, le concert du gymnase"
    resp = client.post(
        "/api/media/upload",
        data={
            "rgpd_ok": "true",
            "legende": legende,
            "auteur": "Marie Dupont",
        },
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert "id" in body
    assert "témoignage" in body["message"].lower() or "merci" in body["message"].lower()

    # Verify the record in DB
    from uuid import UUID
    media_id = UUID(body["id"])
    media = db_session.query(Media).filter(Media.id == media_id).first()
    assert media is not None
    assert media.legende == legende
    assert media.status == MediaStatus.pending
    assert media.uploaded_by == "Marie Dupont"


def test_upload_text_only_empty_legende_returns_400(client):
    """POST with rgpd_ok=true but whitespace-only legende must return 400."""
    resp = client.post(
        "/api/media/upload",
        data={"rgpd_ok": "true", "legende": "   "},
    )
    assert resp.status_code == 400


# ── Public listing ────────────────────────────────────────────────────────────

def test_get_public_media_returns_200_with_list(client):
    """GET /api/media/public must return 200 with a paginated list structure."""
    resp = client.get("/api/media/public")
    assert resp.status_code == 200
    data = resp.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data
    assert isinstance(data["items"], list)


def test_get_public_media_only_approved(client, db_session):
    """
    GET /api/media/public must only return approved media,
    not pending ones.
    """
    from datetime import timezone, datetime
    from app.models.media import Media, MediaStatus, MediaType

    # Create one pending and one approved media directly in DB
    pending = Media(
        file_url="text://Anonyme",
        type=MediaType.photo,
        legende="Pending media — should not appear",
        status=MediaStatus.pending,
    )
    approved = Media(
        file_url="text://Anonyme",
        type=MediaType.photo,
        legende="Approved media — should appear",
        status=MediaStatus.approved,
        approved_at=datetime.now(timezone.utc),
    )
    db_session.add_all([pending, approved])
    db_session.commit()

    resp = client.get("/api/media/public")
    assert resp.status_code == 200
    items = resp.json()["items"]
    legendes = [i["legende"] for i in items]
    assert "Approved media — should appear" in legendes
    assert "Pending media — should not appear" not in legendes
