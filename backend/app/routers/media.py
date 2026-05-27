import time
from collections import defaultdict
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.media import Media, MediaStatus, MediaType
from app.services.cloudinary_service import upload_file
from app.services.token_service import verify_contribution_token
from app.config import settings


class InMemoryRateLimiter:
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = defaultdict(list)

    def is_allowed(self, client_ip: str) -> bool:
        now = time.time()
        self.history[client_ip] = [
            t for t in self.history[client_ip]
            if now - t < self.window_seconds
        ]
        if len(self.history[client_ip]) >= self.requests_limit:
            return False
        self.history[client_ip].append(now)
        return True


upload_limiter = InMemoryRateLimiter(requests_limit=5, window_seconds=60)


def rate_limit_upload(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not upload_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Trop de tentatives d'upload. Veuillez patienter une minute."
        )


router = APIRouter(prefix="/api/media", tags=["media"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}


@router.post("/upload", dependencies=[Depends(rate_limit_upload)])
async def upload_media(
    token: str = Form(...),
    file: UploadFile = File(...),
    legende: Optional[str] = Form(None),
    date_prise: Optional[date] = Form(None),
    rgpd_ok: bool = Form(...),
    db: Session = Depends(get_db),
):
    if not rgpd_ok:
        raise HTTPException(status_code=400, detail="Vous devez accepter les conditions d'utilisation")

    if not verify_contribution_token(db, token):
        raise HTTPException(status_code=401, detail="Lien de contribution invalide ou expiré")

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Fichier trop lourd (maximum {settings.MAX_UPLOAD_SIZE_MB} Mo)")

    if file.content_type in ALLOWED_IMAGE_TYPES:
        media_type = MediaType.photo
        resource_type = "image"
    elif file.content_type in ALLOWED_VIDEO_TYPES:
        media_type = MediaType.video
        resource_type = "video"
    else:
        raise HTTPException(status_code=415, detail="Format non supporté. Accepté : JPG, PNG, WebP, MP4, MOV, WebM")

    try:
        uploaded = await upload_file(content, resource_type)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'upload cloud (Cloudinary) : {str(e)}. Veuillez verifier les variables d'environnement CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY et CLOUDINARY_API_SECRET."
        )

    try:
        media = Media(
            file_url=uploaded["file_url"],
            thumbnail_url=uploaded["thumbnail_url"],
            type=media_type,
            legende=legende.strip() if legende else None,
            date_prise=date_prise,
            annee=date_prise.year if date_prise else None,
        )
        db.add(media)
        db.commit()
        db.refresh(media)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement en base de données : {str(e)}. Veuillez verifier la variable d'environnement DATABASE_URL."
        )

    return {"message": "Merci ! Votre contribution est en attente de validation.", "id": str(media.id)}


@router.get("/public")
def get_public_media(
    page: int = 1,
    per_page: int = 24,
    annee: Optional[int] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Media).filter(Media.status == MediaStatus.approved)

    if annee:
        query = query.filter(Media.annee == annee)

    total = query.count()
    items = (
        query.order_by(Media.approved_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "per_page": per_page,
        "has_more": (page * per_page) < total,
        "items": [_serialize(m) for m in items],
    }


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    from app.models.comment import Comment
    import datetime
    
    # Nombre de souvenirs validés
    total_memories = db.query(Media).filter(Media.status == MediaStatus.approved).count()
    
    # Nombre de témoignages validés
    total_comments = db.query(Comment).filter(Comment.approved == True).count()
    
    # Années d'histoire depuis 1994
    years_of_history = datetime.datetime.now().year - 1994
    if years_of_history < 30:
        years_of_history = 30
        
    return {
        "years_of_history": years_of_history,
        "total_memories": total_memories,
        "total_comments": total_comments
    }


@router.get("/timeline")
def get_timeline(db: Session = Depends(get_db)):
    """Retourne les années disponibles avec le nombre de médias par année."""
    from sqlalchemy import func

    rows = (
        db.query(Media.annee, func.count(Media.id).label("count"))
        .filter(Media.status == MediaStatus.approved, Media.annee.isnot(None))
        .group_by(Media.annee)
        .order_by(Media.annee)
        .all()
    )
    return [{"annee": r.annee, "count": r.count} for r in rows]


@router.get("/{media_id}")
def get_single_media(media_id: str, db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")
    
    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable ou non approuvé")
    return _serialize(m)


def _serialize(m: Media) -> dict:
    return {
        "id": str(m.id),
        "file_url": m.file_url,
        "thumbnail_url": m.thumbnail_url,
        "type": m.type,
        "legende": m.legende,
        "date_prise": m.date_prise,
        "annee": m.annee,
        "approved_at": m.approved_at,
    }
