import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem } from "../lib/api";
import { likeMedia, repostMedia, shareMedia, reportMedia } from "../lib/api";
import CommentsPanel from "./CommentsPanel";
import ShareModal from "./ShareModal";

// Mute state partagé entre tous les slides
let globalMuted = true;

interface FeedSlideProps {
  item: MediaItem;
  isActive: boolean;
  isKiosk: boolean;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `il y a ${days} j`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  return `il y a ${Math.floor(months / 12)} an${Math.floor(months / 12) > 1 ? "s" : ""}`;
}

function getLikedKey(id: string) { return `lsdj_liked_${id}`; }
function getRepostedKey(id: string) { return `lsdj_reposted_${id}`; }

export default function FeedSlide({ item, isActive, isKiosk }: FeedSlideProps) {
  const isText = item.file_url?.startsWith("text://");
  const authorName = isText ? item.file_url.replace("text://", "") : item.uploaded_by ?? null;
  const videoRef = useRef<HTMLVideoElement>(null);

  const [liked, setLiked] = useState(() => localStorage.getItem(getLikedKey(item.id)) === "1");
  const [likesCount, setLikesCount] = useState(item.likes ?? 0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const likePending = useRef(false);

  const [reposted, setReposted] = useState(() => localStorage.getItem(getRepostedKey(item.id)) === "1");
  const [repostsCount, setRepostsCount] = useState(item.reposts ?? 0);
  const [repostAnimating, setRepostAnimating] = useState(false);
  const repostPending = useRef(false);

  const [muted, setMuted] = useState(globalMuted);

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [reported, setReported] = useState(false);
  const reportPending = useRef(false);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.muted = globalMuted;
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, [isActive]);

  // Sync muted via ref — React ne met pas à jour l'attribut muted du DOM après le premier render
  useEffect(() => {
    if (videoRef.current) videoRef.current.muted = muted;
  }, [muted]);

  const toggleMute = () => {
    globalMuted = !globalMuted;
    setMuted(globalMuted);
  };

  const handleLike = async () => {
    if (likePending.current) return;
    likePending.current = true;
    const newLiked = !liked;
    setLiked(newLiked);
    if (newLiked) {
      setLikeAnimating(true);
      setTimeout(() => setLikeAnimating(false), 600);
      localStorage.setItem(getLikedKey(item.id), "1");
    } else {
      localStorage.removeItem(getLikedKey(item.id));
    }
    try {
      const res = await likeMedia(item.id, newLiked ? "like" : "unlike");
      setLikesCount(res.likes);
    } catch {
      setLikesCount((c) => (newLiked ? c + 1 : Math.max(0, c - 1)));
    } finally {
      likePending.current = false;
    }
  };

  const handleRepost = async () => {
    if (repostPending.current) return;
    repostPending.current = true;
    const newReposted = !reposted;
    setReposted(newReposted);
    if (newReposted) {
      setRepostAnimating(true);
      setTimeout(() => setRepostAnimating(false), 600);
      localStorage.setItem(getRepostedKey(item.id), "1");
    } else {
      localStorage.removeItem(getRepostedKey(item.id));
    }
    try {
      const res = await repostMedia(item.id, newReposted ? "repost" : "unrepost");
      setRepostsCount(res.reposts);
    } catch {
      setRepostsCount((c) => (newReposted ? c + 1 : Math.max(0, c - 1)));
    } finally {
      repostPending.current = false;
    }
  };

  const handleOpenShare = () => {
    shareMedia(item.id);
    setShowShare(true);
  };

  const handleReport = async () => {
    if (reportPending.current || reported) return;
    reportPending.current = true;
    try {
      await reportMedia(item.id);
      setReported(true);
    } catch {
      // silencieux
    } finally {
      reportPending.current = false;
    }
  };

  return (
    <div className="relative w-full h-full bg-black overflow-hidden">
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
          className="absolute inset-0 w-full h-full object-contain"
          muted
          loop
          playsInline
        />
      ) : (
        <img
          src={item.file_url}
          alt={item.legende ?? ""}
          className="absolute inset-0 w-full h-full object-contain"
          loading="lazy"
        />
      )}

      {/* Bouton mute — vidéos uniquement */}
      {!isKiosk && item.type === "video" && !isText && (
        <button
          onClick={toggleMute}
          className="absolute top-16 sm:top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white transition-colors hover:bg-black/60"
        >
          {muted ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
          )}
        </button>
      )}

      {/* Overlay gradient bas */}
      {!isKiosk && (
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      )}

      {/* Infos bas-gauche */}
      {!isKiosk && (
        <div className="absolute bottom-20 sm:bottom-6 left-4 right-20 space-y-1 z-10">
          {authorName && (
            <p className="text-white font-semibold text-sm drop-shadow">{authorName}</p>
          )}
          {item.legende && !isText && (
            <p className="text-white/80 text-sm leading-snug line-clamp-3 drop-shadow">{item.legende}</p>
          )}
          {item.approved_at && (
            <p className="text-white/50 text-xs">{timeAgo(item.approved_at)}</p>
          )}
        </div>
      )}

      {/* Boutons bas-droit */}
      {!isKiosk && (
        <div className="absolute bottom-20 sm:bottom-6 right-3 flex flex-col items-center gap-5 z-10">
          {/* Like */}
          <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
            <div className="relative w-8 h-8">
              <AnimatePresence>
                {likeAnimating && (
                  <motion.div
                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
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
                className="w-full h-full"
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
          </button>

          {/* Repost (deux flèches circulaires) */}
          <button onClick={handleRepost} className="flex flex-col items-center gap-1 group">
            <motion.div
              animate={repostAnimating ? { rotate: [0, 360] } : {}}
              transition={{ duration: 0.5 }}
            >
              <svg
                viewBox="0 0 24 24"
                className={`w-8 h-8 drop-shadow transition-colors ${reposted ? "fill-green-400" : "fill-white/80 group-hover:fill-green-300"}`}
              >
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            </motion.div>
            <span className="text-white text-xs font-medium drop-shadow">{repostsCount}</span>
          </button>

          {/* Partage (flèche courbée) */}
          <button onClick={handleOpenShare} className="flex flex-col items-center gap-1 group">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white/80 group-hover:fill-white drop-shadow transition-colors">
              <path d="M14 9V5l7 7-7 7v-4.1c-5 0-8.5 1.6-11 5.1 1-5 4-10 11-11z" />
            </svg>
          </button>

          {/* Signaler */}
          <button onClick={handleReport} className="flex flex-col items-center gap-1 group" title="Signaler ce contenu">
            <svg viewBox="0 0 24 24" className={`w-6 h-6 drop-shadow transition-colors ${reported ? "fill-orange-400" : "fill-white/40 group-hover:fill-orange-300"}`}>
              <path d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z"/>
            </svg>
          </button>
        </div>
      )}

      {showComments && (
        <CommentsPanel mediaId={item.id} onClose={() => setShowComments(false)} />
      )}

      {showShare && (
        <ShareModal
          mediaId={item.id}
          legende={item.legende}
          fileUrl={item.file_url}
          thumbnailUrl={item.thumbnail_url}
          mediaType={item.type}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
