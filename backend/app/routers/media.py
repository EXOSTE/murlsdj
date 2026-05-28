import logging
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, Request
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.media import Media, MediaStatus, MediaType
from app.services.cloudinary_service import upload_file
from app.services.rate_limiter import is_allowed as db_rate_allowed
from app.config import settings

logger = logging.getLogger(__name__)


def _ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def rate_limit_upload(request: Request, db: Session = Depends(get_db)):
    if not db_rate_allowed(db, "upload", _ip(request), limit=10, window_seconds=60):
        raise HTTPException(429, detail="Trop de tentatives d'upload. Veuillez patienter une minute.")


def rate_limit_register(request: Request, db: Session = Depends(get_db)):
    if not db_rate_allowed(db, "register", _ip(request), limit=10, window_seconds=60):
        raise HTTPException(429, detail="Trop de tentatives d'upload. Veuillez patienter une minute.")


def rate_limit_like(request: Request, db: Session = Depends(get_db)):
    if not db_rate_allowed(db, "like", _ip(request), limit=3, window_seconds=60):
        raise HTTPException(429, detail="Trop de likes. Veuillez patienter.")


def rate_limit_share(request: Request, db: Session = Depends(get_db)):
    if not db_rate_allowed(db, "share", _ip(request), limit=10, window_seconds=60):
        raise HTTPException(429, detail="Trop de partages. Veuillez patienter.")


def rate_limit_report(request: Request, db: Session = Depends(get_db)):
    if not db_rate_allowed(db, "report", _ip(request), limit=3, window_seconds=300):
        raise HTTPException(429, detail="Signalement déjà enregistré.")


router = APIRouter(prefix="/api/media", tags=["media"])

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo", "video/webm"}


def _detect_media_type(content: bytes) -> str | None:
    """Detect MIME type from file magic bytes, ignoring client-supplied Content-Type."""
    if len(content) < 12:
        return None
    if content[:3] == b'\xff\xd8\xff':
        return "image/jpeg"
    if content[:8] == b'\x89PNG\r\n\x1a\n':
        return "image/png"
    if content[:6] in (b'GIF87a', b'GIF89a'):
        return "image/gif"
    if content[:4] == b'RIFF' and content[8:12] == b'WEBP':
        return "image/webp"
    if content[:4] == b'\x1a\x45\xdf\xa3':
        return "video/webm"
    if content[4:8] == b'ftyp':
        brand = content[8:12]
        if brand in (b'qt  ', b'mqt ', b'MSNV'):
            return "video/quicktime"
        return "video/mp4"
    if content[:4] == b'RIFF' and content[8:11] == b'AVI':
        return "video/x-msvideo"
    return None


@router.post("/upload", dependencies=[Depends(rate_limit_upload)])
async def upload_media(
    file: Optional[UploadFile] = File(None),
    legende: Optional[str] = Form(None),
    date_prise: Optional[date] = Form(None),
    rgpd_ok: bool = Form(...),
    auteur: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if not rgpd_ok:
        raise HTTPException(status_code=400, detail="Vous devez accepter les conditions d'utilisation")

    # If no file is supplied, it is a text-only testimony!
    if not file:
        if not legende or not legende.strip():
            raise HTTPException(status_code=400, detail="Le texte du témoignage ne peut pas être vide")
        
        author_name = auteur.strip() if auteur else "Anonyme"
        try:
            media = Media(
                file_url=f"text://{author_name}",
                thumbnail_url=None,
                type=MediaType.photo,  # Treat as photo for DB type compatibility
                legende=legende.strip(),
                date_prise=date_prise,
                annee=date_prise.year if date_prise else None,
                uploaded_by=author_name,
            )
            db.add(media)
            db.commit()
            db.refresh(media)
        except Exception as e:
            db.rollback()
            logger.error("Erreur enregistrement témoignage: %s", e, exc_info=True)
            raise HTTPException(
                status_code=500,
                detail="Une erreur interne est survenue. Veuillez réessayer."
            )
        return {"message": "Merci ! Votre témoignage est en attente de validation.", "id": str(media.id)}

    content = await file.read()
    max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(status_code=413, detail=f"Fichier trop lourd (maximum {settings.MAX_UPLOAD_SIZE_MB} Mo)")

    detected_type = _detect_media_type(content)
    if detected_type in ALLOWED_IMAGE_TYPES:
        media_type = MediaType.photo
        resource_type = "image"
    elif detected_type in ALLOWED_VIDEO_TYPES:
        media_type = MediaType.video
        resource_type = "video"
    else:
        raise HTTPException(status_code=415, detail="Format non supporté. Accepté : JPG, PNG, WebP, MP4, MOV, WebM")

    try:
        uploaded = await upload_file(content, resource_type)
    except Exception as e:
        logger.error("Erreur upload Cloudinary: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Erreur lors de l'envoi du fichier. Veuillez réessayer."
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
        logger.error("Erreur enregistrement média en base: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Une erreur interne est survenue. Veuillez réessayer."
        )

    return {"message": "Merci ! Votre contribution est en attente de validation.", "id": str(media.id)}


@router.get("/public")
def get_public_media(
    page: int = 1,
    per_page: int = 24,
    annee: Optional[int] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(Media).filter(Media.status == MediaStatus.approved)

    if annee:
        query = query.filter(Media.annee == annee)

    if search and search.strip():
        query = query.filter(Media.legende.ilike(f"%{search.strip()}%"))

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
    
    # Années d'histoire (célébration des 30 ans)
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


@router.get("/upload-signature", dependencies=[Depends(rate_limit_upload)])
def get_upload_signature():
    import cloudinary.utils, time
    timestamp = int(time.time())
    params_to_sign = {"folder": "mur-lsdj", "timestamp": timestamp}
    signature = cloudinary.utils.api_sign_request(params_to_sign, settings.CLOUDINARY_API_SECRET)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "api_key": settings.CLOUDINARY_API_KEY,
        "cloud_name": settings.CLOUDINARY_CLOUD_NAME,
        "folder": "mur-lsdj",
    }


@router.post("/register", dependencies=[Depends(rate_limit_register)])
def register_media(
    file_url: str = Form(...),
    public_id: str = Form(...),
    resource_type: str = Form(...),
    legende: Optional[str] = Form(None),
    date_prise: Optional[date] = Form(None),
    rgpd_ok: bool = Form(...),
    auteur: Optional[str] = Form(None),
    db: Session = Depends(get_db),
):
    if not rgpd_ok:
        raise HTTPException(status_code=400, detail="Vous devez accepter les conditions d'utilisation")
    if resource_type not in ("image", "video"):
        raise HTTPException(status_code=400, detail="Type de média invalide")

    cloud = settings.CLOUDINARY_CLOUD_NAME
    if resource_type == "image":
        thumbnail_url = f"https://res.cloudinary.com/{cloud}/image/upload/w_600,h_400,c_fill,f_jpg/{public_id}.jpg"
        media_type = MediaType.photo
    else:
        thumbnail_url = f"https://res.cloudinary.com/{cloud}/video/upload/so_0,w_600,h_400,c_fill,f_jpg/{public_id}.jpg"
        media_type = MediaType.video

    author_name = auteur.strip() if auteur else None
    try:
        media = Media(
            file_url=file_url,
            thumbnail_url=thumbnail_url,
            type=media_type,
            legende=legende.strip() if legende else None,
            date_prise=date_prise,
            annee=date_prise.year if date_prise else None,
            uploaded_by=author_name,
        )
        db.add(media)
        db.commit()
        db.refresh(media)
    except Exception as e:
        db.rollback()
        logger.error("Erreur enregistrement média: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Une erreur interne est survenue.")
    return {"message": "Merci ! Votre contribution est en attente de validation.", "id": str(media.id)}


@router.get("/popular")
def get_popular_media(
    page: int = 1,
    per_page: int = 10,
    db: Session = Depends(get_db),
):
    score_expr = Media.likes + Media.reposts * 2 + Media.shares
    query = db.query(Media).filter(Media.status == MediaStatus.approved)
    total = query.count()
    items = (
        query.order_by(score_expr.desc(), Media.approved_at.desc())
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


@router.post("/{media_id}/like", dependencies=[Depends(rate_limit_like)])
def like_media(media_id: str, action: str = "like", db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable")

    if action == "unlike":
        m.likes = max(0, (m.likes or 0) - 1)
    else:
        m.likes = (m.likes or 0) + 1
    db.commit()
    db.refresh(m)
    return {"likes": m.likes}


@router.post("/{media_id}/repost")
def repost_media(media_id: str, action: str = "repost", db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable")

    if action == "unrepost":
        m.reposts = max(0, (m.reposts or 0) - 1)
    else:
        m.reposts = (m.reposts or 0) + 1
    db.commit()
    db.refresh(m)
    return {"reposts": m.reposts}


REPORT_QUARANTINE_THRESHOLD = 5


@router.post("/{media_id}/report", dependencies=[Depends(rate_limit_report)])
def report_media(media_id: str, db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable")

    m.reports = (m.reports or 0) + 1
    if m.reports >= REPORT_QUARANTINE_THRESHOLD:
        m.status = MediaStatus.pending
        m.approved_at = None
        logger.warning("Média %s mis en quarantaine automatique (%d signalements)", media_id, m.reports)
    db.commit()
    return {"message": "Signalement enregistré"}


@router.post("/{media_id}/share", dependencies=[Depends(rate_limit_share)])
def share_media(media_id: str, db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable")

    m.shares = (m.shares or 0) + 1
    db.commit()
    return {"shares": m.shares}


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
        "uploaded_by": m.uploaded_by,
        "likes": m.likes or 0,
        "reposts": m.reposts or 0,
        "shares": m.shares or 0,
        "reports": m.reports or 0,
    }
