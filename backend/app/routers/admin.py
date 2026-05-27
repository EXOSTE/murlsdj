import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Body, Depends, HTTPException, Header
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.media import Media, MediaStatus, MediaType
from app.models.settings import Setting
from app.models.comment import Comment
from app.services.token_service import verify_admin_secret, get_setting

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/admin", tags=["admin"])


def check_admin(
    x_admin_secret: Optional[str] = Header(None, alias="X-Admin-Secret"),
    db: Session = Depends(get_db),
):
    if not x_admin_secret or not verify_admin_secret(db, x_admin_secret):
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


@router.delete("/delete/{media_id}")
def delete_media(media_id: str, db: Session = Depends(get_db), _=Depends(check_admin)):
    media = _get_or_404(db, media_id)
    if media.file_url and not media.file_url.startswith("text://"):
        try:
            import cloudinary.uploader
            resource_type = "video" if media.type == MediaType.video else "image"
            parts = media.file_url.split("/upload/")
            if len(parts) == 2:
                public_id_part = parts[1]
                if "/" in public_id_part and public_id_part.split("/")[0].startswith("v") and public_id_part.split("/")[0][1:].isdigit():
                    public_id_part = public_id_part.split("/", 1)[1]
                public_id = public_id_part.rsplit(".", 1)[0] if "." in public_id_part else public_id_part
                cloudinary.uploader.destroy(public_id, resource_type=resource_type)
        except Exception as e:
            logger.warning("Échec suppression Cloudinary: %s", e)
    db.delete(media)
    db.commit()
    return {"message": "Supprimé"}


@router.post("/bulk-approve")
def bulk_approve(ids: List[str] = Body(...), db: Session = Depends(get_db), _=Depends(check_admin)):
    now = datetime.now(timezone.utc)
    for media_id in ids:
        media = db.query(Media).filter(Media.id == media_id).first()
        if media:
            media.status = MediaStatus.approved
            media.approved_at = now
    db.commit()
    return {"message": f"{len(ids)} éléments approuvés"}


@router.post("/bulk-reject")
def bulk_reject(ids: List[str] = Body(...), db: Session = Depends(get_db), _=Depends(check_admin)):
    for media_id in ids:
        media = db.query(Media).filter(Media.id == media_id).first()
        if media:
            media.status = MediaStatus.rejected
    db.commit()
    return {"message": f"{len(ids)} éléments rejetés"}


@router.get("/token")
def get_contribution_token(db: Session = Depends(get_db), _=Depends(check_admin)):
    token_value = get_setting(db, "contribution_token")
    return {"token": token_value}


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
        "uploaded_by": m.uploaded_by,
        "raison_rejet": m.raison_rejet,
        "reports": m.reports or 0,
    }
