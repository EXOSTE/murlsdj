import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Form
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.comment import Comment
from app.routers.media import InMemoryRateLimiter

router = APIRouter(prefix="/api/comments", tags=["comments"])

comment_limiter = InMemoryRateLimiter(requests_limit=10, window_seconds=60)


def rate_limit_comment(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not comment_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Trop de commentaires soumis. Veuillez patienter une minute."
        )


@router.post("/{media_id}", dependencies=[Depends(rate_limit_comment)])
def create_comment(
    media_id: str,
    author: str = Form(...),
    content: str = Form(...),
    db: Session = Depends(get_db),
):
    try:
        media_uuid = uuid.UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    author_clean = author.strip()
    content_clean = content.strip()

    if not author_clean or not content_clean:
        raise HTTPException(status_code=400, detail="L'auteur et le message ne peuvent pas être vides")

    if len(author_clean) > 100:
        raise HTTPException(status_code=400, detail="Nom d'auteur trop long (max 100 caractères)")

    if len(content_clean) > 300:
        raise HTTPException(status_code=400, detail="Message trop long (max 300 caractères)")

    try:
        comment = Comment(
            media_id=media_uuid,
            author=author_clean,
            content=content_clean,
            approved=False,
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de l'enregistrement du commentaire : {str(e)}"
        )

    return {"message": "Témoignage envoyé. Il apparaîtra après modération."}


@router.get("/{media_id}")
def get_comments(media_id: str, db: Session = Depends(get_db)):
    try:
        media_uuid = uuid.UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    comments = (
        db.query(Comment)
        .filter(Comment.media_id == media_uuid, Comment.approved == True)
        .order_by(Comment.created_at.desc())
        .all()
    )

    return [
        {
            "id": str(c.id),
            "media_id": str(c.media_id),
            "author": c.author,
            "content": c.content,
            "created_at": c.created_at,
        }
        for c in comments
    ]
