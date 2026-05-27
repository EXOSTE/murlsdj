# Feed TikTok Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la page d'accueil par un feed TikTok plein écran avec likes, commentaires, partage et mode kiosque.

**Architecture:** Feed vertical snap-scroll (`scroll-snap-type: y mandatory`), chaque slide = 100dvh. Backend étendu avec champ `likes` sur Media et route `POST /api/media/{id}/like`. Frontend décomposé en Feed (orchestrateur) + FeedSlide (une slide) + CommentsPanel (panneau bas) + ShareModal (modale partage).

**Tech Stack:** React 19 + Framer Motion + Tailwind CSS | FastAPI + SQLAlchemy + SQLite/PostgreSQL

---

## Task 1 : Champ `likes` sur le modèle Media (backend)

**Files:**
- Modify: `backend/app/models/media.py`
- Modify: `backend/app/routers/media.py` (fonction `_serialize`)

- [ ] **Ajouter la colonne `likes` au modèle**

Ouvrir `backend/app/models/media.py` et ajouter après `raison_rejet` :

```python
likes = Column(Integer, nullable=False, default=0, server_default="0")
```

Le fichier complet devient :

```python
import enum
import uuid
from sqlalchemy import Column, String, Text, Date, Integer, Enum, DateTime, func, Uuid
from app.database import Base


class MediaType(str, enum.Enum):
    photo = "photo"
    video = "video"


class MediaStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Media(Base):
    __tablename__ = "media"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    file_url = Column(Text, nullable=False)
    thumbnail_url = Column(Text, nullable=True)
    type = Column(Enum(MediaType), nullable=False)
    legende = Column(Text, nullable=True)
    date_prise = Column(Date, nullable=True)
    annee = Column(Integer, nullable=True)
    status = Column(Enum(MediaStatus), nullable=False, default=MediaStatus.pending)
    uploaded_at = Column(DateTime, server_default=func.now())
    approved_at = Column(DateTime, nullable=True)
    uploaded_by = Column(String(255), nullable=True)
    raison_rejet = Column(Text, nullable=True)
    likes = Column(Integer, nullable=False, default=0, server_default="0")
```

- [ ] **Migrer la base existante**

`create_all` ne modifie pas les tables existantes. Exécuter manuellement dans le répertoire `backend/` :

```bash
# SQLite (dev)
python -c "
from app.database import engine
with engine.connect() as conn:
    conn.execute('ALTER TABLE media ADD COLUMN likes INTEGER NOT NULL DEFAULT 0')
    conn.commit()
print('Migration OK')
"
```

Si la commande échoue avec "duplicate column", la colonne existe déjà — ignorer.

Pour **PostgreSQL (production)**, exécuter la même requête SQL via le dashboard de l'hébergeur ou psql :
```sql
ALTER TABLE media ADD COLUMN IF NOT EXISTS likes INTEGER NOT NULL DEFAULT 0;
```

- [ ] **Inclure `likes` dans `_serialize()` dans `media.py`**

Dans `backend/app/routers/media.py`, modifier la fonction `_serialize` (celle du router media, pas admin) :

```python
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
        "likes": m.likes,
    }
```

- [ ] **Commit**

```bash
git add backend/app/models/media.py backend/app/routers/media.py
git commit -m "feat(backend): add likes field to Media model"
```

---

## Task 2 : Route `POST /api/media/{id}/like` (backend)

**Files:**
- Modify: `backend/app/routers/media.py`

- [ ] **Ajouter le rate limiter et la route like**

Dans `backend/app/routers/media.py`, après la définition de `upload_limiter` (ligne ~37), ajouter :

```python
like_limiter = InMemoryRateLimiter(requests_limit=3, window_seconds=60)


def rate_limit_like(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    if not like_limiter.is_allowed(client_ip):
        raise HTTPException(status_code=429, detail="Trop de likes. Veuillez patienter.")
```

Puis ajouter la route après `get_single_media` :

```python
@router.post("/{media_id}/like", dependencies=[Depends(rate_limit_like)])
def like_media(media_id: str, db: Session = Depends(get_db)):
    from uuid import UUID
    try:
        uuid_val = UUID(media_id)
    except ValueError:
        raise HTTPException(status_code=400, detail="ID de média invalide")

    m = db.query(Media).filter(Media.id == uuid_val, Media.status == MediaStatus.approved).first()
    if not m:
        raise HTTPException(status_code=404, detail="Média introuvable")

    m.likes = (m.likes or 0) + 1
    db.commit()
    db.refresh(m)
    return {"likes": m.likes}
```

- [ ] **Vérifier manuellement**

Démarrer le backend : `uvicorn app.main:app --reload`

Tester avec curl (remplacer `<uuid>` par un vrai ID approuvé) :
```bash
curl -X POST http://localhost:8000/api/media/<uuid>/like
# Réponse attendue : {"likes": 1}
```

- [ ] **Commit**

```bash
git add backend/app/routers/media.py
git commit -m "feat(backend): add POST /api/media/{id}/like route"
```

---

## Task 3 : Fonction `likeMedia` dans api.ts (frontend)

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Ajouter le type `likes` dans `MediaItem` et la fonction `likeMedia`**

Dans `frontend/src/lib/api.ts`, ajouter `likes` dans l'interface `MediaItem` :

```typescript
export interface MediaItem {
  id: string;
  file_url: string;
  thumbnail_url: string;
  type: "photo" | "video";
  legende: string | null;
  date_prise: string | null;
  annee: number | null;
  approved_at: string | null;
  uploaded_at?: string | null;
  uploaded_by?: string | null;
  status?: "pending" | "approved" | "rejected";
  raison_rejet?: string | null;
  likes?: number;
}
```

Puis ajouter la fonction à la fin de la section publique :

```typescript
export const likeMedia = async (id: string): Promise<{ likes: number }> => {
  const res = await api.post(`/api/media/${id}/like`);
  return res.data;
};
```

- [ ] **Commit**

```bash
git add frontend/src/lib/api.ts
git commit -m "feat(frontend): add likeMedia API function"
```

---

## Task 4 : Composant `CommentsPanel` (frontend)

**Files:**
- Create: `frontend/src/components/CommentsPanel.tsx`

Ce composant est un panneau slide-up autonome réutilisant la logique commentaires déjà présente dans `Lightbox.tsx`.

- [ ] **Créer `frontend/src/components/CommentsPanel.tsx`**

```tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getComments, createComment } from "../lib/api";
import type { CommentItem } from "../lib/api";

interface CommentsPanelProps {
  mediaId: string;
  onClose: () => void;
}

export default function CommentsPanel({ mediaId, onClose }: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const touchStartY = useRef(0);

  const loadComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getComments(mediaId);
      setComments(data);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [mediaId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim()) return;
    setSubmitState("submitting");
    setSubmitError("");
    try {
      await createComment(mediaId, author.trim(), content.trim());
      setSubmitState("success");
      setAuthor("");
      setContent("");
      setTimeout(() => setSubmitState("idle"), 4000);
    } catch (err: any) {
      setSubmitState("error");
      setSubmitError(err?.response?.data?.detail || "Une erreur est survenue.");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.changedTouches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = e.changedTouches[0].clientY - touchStartY.current;
    if (diff > 80) onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

        {/* Panneau */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl flex flex-col"
          style={{ height: "70vh" }}
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 shrink-0">
            <h3 className="font-serif text-encre text-base">
              Commentaires {comments.length > 0 && `(${comments.length})`}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>

          {/* Liste */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {loading && <p className="text-slate-400 text-sm text-center">Chargement…</p>}
            {!loading && comments.length === 0 && (
              <p className="text-slate-400 text-sm text-center pt-8">Aucun commentaire pour l'instant.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-bleu">{c.author}</span>
                  <span className="text-xs text-slate-400">
                    {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </span>
                </div>
                <p className="text-sm text-slate-700 italic">"{c.content}"</p>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 px-5 py-4 space-y-2 shrink-0 bg-white">
            {submitState === "success" ? (
              <p className="text-sm text-emerald-600 text-center py-2">Merci ! Votre commentaire sera visible après modération.</p>
            ) : (
              <>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Votre nom"
                  maxLength={100}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrire un commentaire…"
                    maxLength={300}
                    className="flex-1 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bleu"
                  />
                  <button
                    type="submit"
                    disabled={!author.trim() || !content.trim() || submitState === "submitting"}
                    className="bg-bleu text-white text-sm px-4 rounded-xl disabled:opacity-40"
                  >
                    {submitState === "submitting" ? "…" : "Envoyer"}
                  </button>
                </div>
                {submitState === "error" && <p className="text-red-500 text-xs">{submitError}</p>}
              </>
            )}
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/CommentsPanel.tsx
git commit -m "feat(frontend): add CommentsPanel slide-up component"
```

---

## Task 5 : Composant `ShareModal` (frontend)

**Files:**
- Create: `frontend/src/components/ShareModal.tsx`

- [ ] **Créer `frontend/src/components/ShareModal.tsx`**

```tsx
import { motion, AnimatePresence } from "framer-motion";

interface ShareModalProps {
  mediaId: string;
  legende: string | null;
  onClose: () => void;
}

export default function ShareModal({ mediaId, legende, onClose }: ShareModalProps) {
  const url = `${window.location.origin}/?media=${mediaId}`;
  const text = legende ? `${legende} — ${url}` : url;

  const options = [
    {
      label: "WhatsApp",
      color: "bg-[#25D366] hover:bg-[#20b858]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
      ),
      href: `https://wa.me/?text=${encodeURIComponent(text)}`,
    },
    {
      label: "SMS",
      color: "bg-slate-700 hover:bg-slate-800",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
        </svg>
      ),
      href: `sms:?body=${encodeURIComponent(text)}`,
    },
    {
      label: "Facebook",
      color: "bg-[#1877F2] hover:bg-[#166fe5]",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ url, title: legende ?? "Un souvenir — Mur LSDJ" });
      } catch {
        // user cancelled
      }
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <motion.div
          className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm p-6 space-y-3"
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 60, opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
        >
          <h3 className="font-serif text-encre text-center text-base mb-4">Partager ce souvenir</h3>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt) => (
              <a
                key={opt.label}
                href={opt.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={onClose}
                className={`${opt.color} text-white flex items-center gap-3 px-4 py-3 rounded-xl transition-colors`}
              >
                {opt.icon}
                <span className="text-sm font-medium">{opt.label}</span>
              </a>
            ))}
            <button
              onClick={handleNativeShare}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-3 px-4 py-3 rounded-xl transition-colors col-span-2"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 1 1 0-2.684m0 2.684 6.632 3.316m-6.632-6 6.632-3.316m0 0a3 3 0 1 0 5.367-2.684 3 3 0 0 0-5.367 2.684zm0 9.316a3 3 0 1 0 5.368 2.684 3 3 0 0 0-5.368-2.684z" />
              </svg>
              <span className="text-sm font-medium">Autres applications</span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/ShareModal.tsx
git commit -m "feat(frontend): add ShareModal component"
```

---

## Task 6 : Composant `FeedSlide` (frontend)

**Files:**
- Create: `frontend/src/components/FeedSlide.tsx`

Une slide = un souvenir plein écran avec overlay, boutons d'interaction, et gestion kiosque.

- [ ] **Créer `frontend/src/components/FeedSlide.tsx`**

```tsx
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem } from "../lib/api";
import { likeMedia } from "../lib/api";
import CommentsPanel from "./CommentsPanel";
import ShareModal from "./ShareModal";

interface FeedSlideProps {
  item: MediaItem;
  isActive: boolean;
  isKiosk: boolean;
}

function getLikedKey(id: string) {
  return `lsdj_liked_${id}`;
}

export default function FeedSlide({ item, isActive, isKiosk }: FeedSlideProps) {
  const isText = item.file_url?.startsWith("text://");
  const authorName = isText ? item.file_url.replace("text://", "") : item.uploaded_by ?? null;
  const videoRef = useRef<HTMLVideoElement>(null);

  const [liked, setLiked] = useState(() => localStorage.getItem(getLikedKey(item.id)) === "1");
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  // Lecture/pause vidéo selon slide active
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  const handleLike = async () => {
    if (liked) return;
    setLiked(true);
    setLikeAnimating(true);
    localStorage.setItem(getLikedKey(item.id), "1");
    setTimeout(() => setLikeAnimating(false), 600);
    try {
      const res = await likeMedia(item.id);
      setLikesCount(res.likes);
    } catch {
      setLikesCount((c) => c + 1);
    }
  };

  return (
    <div className="relative w-full h-full flex-shrink-0 bg-black overflow-hidden">
      {/* Média de fond */}
      {isText ? (
        <div className="absolute inset-0 bg-gradient-to-br from-bleu to-encre flex items-center justify-center p-8">
          <p className="font-serif text-white/90 text-xl sm:text-2xl text-center italic leading-relaxed max-w-lg">
            « {item.legende} »
          </p>
        </div>
      ) : item.type === "video" ? (
        <video
          ref={videoRef}
          src={item.file_url}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={item.file_url}
          alt={item.legende ?? ""}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      )}

      {/* Overlay gradient bas */}
      {!isKiosk && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      )}

      {/* Infos bas-gauche */}
      {!isKiosk && (
        <div className="absolute bottom-6 left-4 right-20 space-y-1 z-10">
          {authorName && (
            <p className="text-white font-semibold text-sm drop-shadow">{authorName}</p>
          )}
          {item.legende && !isText && (
            <p className="text-white/80 text-sm leading-snug line-clamp-3 drop-shadow">{item.legende}</p>
          )}
          {item.date_prise && (
            <p className="text-white/50 text-xs">
              {new Date(item.date_prise).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
            </p>
          )}
        </div>
      )}

      {/* Boutons bas-droit */}
      {!isKiosk && (
        <div className="absolute bottom-6 right-3 flex flex-col items-center gap-5 z-10">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className="relative">
              <AnimatePresence>
                {likeAnimating && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center"
                    initial={{ scale: 1, opacity: 1 }}
                    animate={{ scale: 2.5, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-2xl">❤️</span>
                  </motion.div>
                )}
              </AnimatePresence>
              <motion.div
                animate={likeAnimating ? { scale: [1, 1.4, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                <svg
                  viewBox="0 0 24 24"
                  className={`w-8 h-8 drop-shadow transition-colors ${liked ? "fill-red-500" : "fill-white/80 group-hover:fill-red-400"}`}
                >
                  <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                </svg>
              </motion.div>
            </div>
            <span className="text-white text-xs font-medium drop-shadow">{likesCount}</span>
          </button>

          {/* Commentaires */}
          <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1 group">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white/80 group-hover:fill-white drop-shadow transition-colors">
              <path fillRule="evenodd" d="M4.804 21.644A6.707 6.707 0 0 0 6 21.75a6.721 6.721 0 0 0 3.583-1.029c.774.182 1.584.279 2.417.279 5.322 0 9.75-3.97 9.75-9 0-5.03-4.428-9-9.75-9s-9.75 3.97-9.75 9c0 2.409 1.025 4.587 2.674 6.192.232.226.277.428.254.543a3.73 3.73 0 0 1-.814 1.686.75.75 0 0 0 .44 1.223 6.676 6.676 0 0 0 .946.074Z" clipRule="evenodd" />
            </svg>
            <span className="text-white text-xs font-medium drop-shadow">
              {item.legende ? "" : ""}
            </span>
          </button>

          {/* Partage */}
          <button onClick={() => setShowShare(true)} className="flex flex-col items-center gap-1 group">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white/80 group-hover:fill-white drop-shadow transition-colors">
              <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Panneau commentaires */}
      {showComments && (
        <CommentsPanel mediaId={item.id} onClose={() => setShowComments(false)} />
      )}

      {/* Modale partage */}
      {showShare && (
        <ShareModal mediaId={item.id} legende={item.legende} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/FeedSlide.tsx
git commit -m "feat(frontend): add FeedSlide component"
```

---

## Task 7 : Page `Feed.tsx` — orchestrateur principal (frontend)

**Files:**
- Create: `frontend/src/pages/Feed.tsx`

- [ ] **Créer `frontend/src/pages/Feed.tsx`**

```tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getPublicMedia } from "../lib/api";
import type { MediaItem } from "../lib/api";
import FeedSlide from "../components/FeedSlide";

export default function Feed() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKiosk, setIsKiosk] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const kioskTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialMediaId = searchParams.get("media");

  // Chargement initial
  useEffect(() => {
    loadPage(1);
  }, []);

  const loadPage = useCallback(async (p: number) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await getPublicMedia(p);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.has_more);
      setPage(p);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // Deep link : scroll vers le bon média au premier chargement
  useEffect(() => {
    if (!initialMediaId || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === initialMediaId);
    if (idx !== -1) {
      setActiveIndex(idx);
      const slide = containerRef.current?.children[idx] as HTMLElement;
      slide?.scrollIntoView({ behavior: "instant" });
    }
  }, [initialMediaId, items.length > 0]);

  // Intersection Observer pour détecter la slide active
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Array.from(container.children).indexOf(entry.target as HTMLElement);
            if (idx !== -1) setActiveIndex(idx);
          }
        });
      },
      { root: container, threshold: 0.6 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [items.length]);

  // Charger plus quand il reste 3 slides
  useEffect(() => {
    if (hasMore && !loading && activeIndex >= items.length - 3) {
      loadPage(page + 1);
    }
  }, [activeIndex, items.length, hasMore, loading, page]);

  // Mode kiosque
  const enterKiosk = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen non supporté — continuer quand même
    }
    setIsKiosk(true);
  };

  const exitKiosk = useCallback(() => {
    setIsKiosk(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (kioskTimer.current) clearInterval(kioskTimer.current);
  }, []);

  useEffect(() => {
    if (!isKiosk) return;

    kioskTimer.current = setInterval(() => {
      const container = containerRef.current;
      if (!container) return;
      const nextIndex = (activeIndex + 1) % items.length;
      const slide = container.children[nextIndex] as HTMLElement;
      slide?.scrollIntoView({ behavior: "smooth" });
    }, 3000);

    const handleExit = () => exitKiosk();
    document.addEventListener("keydown", handleExit);
    document.addEventListener("click", handleExit);
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) exitKiosk();
    });

    return () => {
      if (kioskTimer.current) clearInterval(kioskTimer.current);
      document.removeEventListener("keydown", handleExit);
      document.removeEventListener("click", handleExit);
    };
  }, [isKiosk, activeIndex, items.length, exitKiosk]);

  return (
    <div className="relative w-screen h-dvh bg-black overflow-hidden">
      {/* Header */}
      {!isKiosk && (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <Link to="/" className="pointer-events-auto">
            <span className="font-serif text-white text-lg tracking-wide drop-shadow">Mur LSDJ</span>
          </Link>
          <nav className="flex items-center gap-4 pointer-events-auto">
            <Link to="/galerie" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">Galerie</Link>
            <Link to="/timeline" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">Timeline</Link>
            <Link to="/histoire" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">Histoire</Link>
            <button
              onClick={enterKiosk}
              className="text-white/60 hover:text-white transition-colors ml-2"
              title="Mode kiosque"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-9h2V3h-7v2h5z" />
              </svg>
            </button>
          </nav>
        </header>
      )}

      {/* Feed scroll */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="w-full h-dvh flex-shrink-0 snap-start snap-always"
            style={{ scrollSnapAlign: "start" }}
          >
            <FeedSlide item={item} isActive={idx === activeIndex} isKiosk={isKiosk} />
          </div>
        ))}

        {loading && (
          <div className="w-full h-dvh flex items-center justify-center snap-start">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="w-full h-dvh flex flex-col items-center justify-center snap-start gap-4">
            <p className="text-white/60 text-sm">Vous avez vu tous les souvenirs</p>
            <Link to="/contribuer" className="text-white underline text-sm hover:text-white/80">
              Partagez le vôtre →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/pages/Feed.tsx
git commit -m "feat(frontend): add Feed TikTok page"
```

---

## Task 8 : Brancher Feed sur la route `/` dans App.tsx

**Files:**
- Modify: `frontend/src/App.tsx`

- [ ] **Remplacer Home par Feed dans App.tsx**

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Feed from "./pages/Feed";
import Contribute from "./pages/Contribute";
import Gallery from "./pages/Gallery";
import Timeline from "./pages/Timeline";
import Admin from "./pages/Admin";
import About from "./pages/About";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Feed />} />
        <Route path="/contribuer" element={<Contribute />} />
        <Route path="/galerie" element={<Gallery />} />
        <Route path="/timeline" element={<Timeline />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/histoire" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Vérifier que le build TypeScript passe**

```bash
cd frontend && npx tsc --noEmit
```

Attendu : aucune erreur.

- [ ] **Commit**

```bash
git add frontend/src/App.tsx
git commit -m "feat(frontend): wire Feed to / route, replace Home"
```

---

## Task 9 : Vérification manuelle finale

- [ ] **Démarrer backend et frontend**

```bash
# Terminal 1
cd backend && uvicorn app.main:app --reload

# Terminal 2
cd frontend && npm run dev
```

- [ ] **Checklist fonctionnelle**

Ouvrir `http://localhost:5173` et vérifier :

1. Le feed charge et affiche les souvenirs en plein écran
2. Le scroll snap fonctionne (accrochage entre les slides)
3. Les vidéos jouent automatiquement sur la slide active et s'arrêtent sur les autres
4. Le bouton ❤️ incrémente le compteur et reste rouge (re-clic désactivé)
5. Après rechargement, le like est mémorisé (localStorage)
6. Le panneau commentaires s'ouvre et se ferme au swipe bas
7. La modale partage affiche WhatsApp, SMS, Facebook, Autres
8. Le mode kiosque : défilement auto 3s, écran entièrement vide
9. Deep link `/?media=<uuid>` → scroll vers le bon souvenir
10. Les liens header (Galerie, Timeline, Histoire) fonctionnent

- [ ] **Commit final si tout est OK**

```bash
git add -A
git commit -m "feat: TikTok feed — likes, comments, share, kiosk mode"
```
