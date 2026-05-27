import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.media import Media, MediaStatus
from app.models.settings import Setting
from app.models.comment import Comment
from app.services.token_service import verify_admin_secret

router = APIRouter(prefix="/api/admin", tags=["admin"])


def check_admin(
    secret: Optional[str] = Query(None),
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    db: Session = Depends(get_db),
):
    admin_secret = x_admin_secret or secret
    if not admin_secret or not verify_admin_secret(db, admin_secret):
        raise HTTPException(status_code=403, detail="Accès refusé")


@router.get("/pending")
def get_pending(db: Session = Depends(get_db), _=Depends(check_admin)):
    items = (
        db.query(Media)
        .filter(Media.status == MediaStatus.pending)
        .order_by(Media.uploaded_at.desc())
        .all()
    )
    return [_serialize(m) for m in items]


@router.get("/all")
def get_all(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(check_admin),
):
    query = db.query(Media)
    if status:
        query = query.filter(Media.status == status)
    items = query.order_by(Media.uploaded_at.desc()).all()
    return [_serialize(m) for m in items]


@router.post("/approve/{media_id}")
def approve_media(media_id: str, db: Session = Depends(get_db), _=Depends(check_admin)):
    media = _get_or_404(db, media_id)
    media.status = MediaStatus.approved
    media.approved_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Approuvé"}


@router.post("/reject/{media_id}")
def reject_media(
    media_id: str,
    raison: Optional[str] = None,
    db: Session = Depends(get_db),
    _=Depends(check_admin),
):
    media = _get_or_404(db, media_id)
    media.status = MediaStatus.rejected
    media.raison_rejet = raison
    db.commit()
    return {"message": "Rejeté"}


@router.post("/unpublish/{media_id}")
def unpublish_media(media_id: str, db: Session = Depends(get_db), _=Depends(check_admin)):
    media = _get_or_404(db, media_id)
    media.status = MediaStatus.pending
    media.approved_at = None
    db.commit()
    return {"message": "Dépublié"}


@router.get("/token")
def get_contribution_token(db: Session = Depends(get_db), _=Depends(check_admin)):
    setting = db.query(Setting).filter(Setting.key == "contribution_token").first()
    return {"token": setting.value if setting else None}


@router.post("/token/regenerate")
def regenerate_token(db: Session = Depends(get_db), _=Depends(check_admin)):
    new_token = str(uuid.uuid4())
    setting = db.query(Setting).filter(Setting.key == "contribution_token").first()
    if setting:
        setting.value = new_token
    else:
        db.add(Setting(key="contribution_token", value=new_token))
    db.commit()
    return {"token": new_token}


@router.get("/comments/pending")
def get_pending_comments(db: Session = Depends(get_db), _=Depends(check_admin)):
    comments = (
        db.query(Comment)
        .filter(Comment.approved == False)
        .order_by(Comment.created_at.desc())
        .all()
    )
    result = []
    for c in comments:
        media = db.query(Media).filter(Media.id == c.media_id).first()
        result.append({
            "id": str(c.id),
            "media_id": str(c.media_id),
            "author": c.author,
            "content": c.content,
            "created_at": c.created_at,
            "media_thumbnail": media.thumbnail_url if media else None
        })
    return result


@router.post("/comments/approve/{comment_id}")
def approve_comment(comment_id: str, db: Session = Depends(get_db), _=Depends(check_admin)):
    try:
        comment_uuid = uuid.UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de commentaire invalide")
    comment = db.query(Comment).filter(Comment.id == comment_uuid).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")
    comment.approved = True
    db.commit()
    return {"message": "Témoignage approuvé"}


@router.post("/comments/reject/{comment_id}")
def reject_comment(comment_id: str, db: Session = Depends(get_db), _=Depends(check_admin)):
    try:
        comment_uuid = uuid.UUID(comment_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de commentaire invalide")
    comment = db.query(Comment).filter(Comment.id == comment_uuid).first()
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire introuvable")
    db.delete(comment)
    db.commit()
    return {"message": "Témoignage supprimé"}


def _get_or_404(db: Session, media_id: str) -> Media:
    media = db.query(Media).filter(Media.id == media_id).first()
    if not media:
        raise HTTPException(status_code=404, detail="Média introuvable")
    return media


def _serialize(m: Media) -> dict:
    return {
        "id": str(m.id),
        "file_url": m.file_url,
        "thumbnail_url": m.thumbnail_url,
        "type": m.type,
        "legende": m.legende,
        "date_prise": m.date_prise,
        "annee": m.annee,
        "status": m.status,
        "uploaded_at": m.uploaded_at,
        "approved_at": m.approved_at,
        "raison_rejet": m.raison_rejet,
    }
