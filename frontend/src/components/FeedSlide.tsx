import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem } from "../lib/api";
import { likeMedia, repostMedia, shareMedia } from "../lib/api";
import CommentsPanel from "./CommentsPanel";
import ShareModal from "./ShareModal";

interface FeedSlideProps {
  item: MediaItem;
  isActive: boolean;
  isKiosk: boolean;
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

  const [reposted, setReposted] = useState(() => localStorage.getItem(getRepostedKey(item.id)) === "1");
  const [repostsCount, setRepostsCount] = useState(item.reposts ?? 0);
  const [repostAnimating, setRepostAnimating] = useState(false);

  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
    }
  };

  const handleRepost = async () => {
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
    }
  };

  const handleOpenShare = () => {
    shareMedia(item.id);
    setShowShare(true);
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

          {/* Partage (flèche TikTok) */}
          <button onClick={handleOpenShare} className="flex flex-col items-center gap-1 group">
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-white/80 group-hover:fill-white drop-shadow transition-colors">
              <path d="M13.12 2.06 7.58 7.6c-.38.38-.11 1.02.42 1.02H11v8c0 .55.45 1 1 1s1-.45 1-1V8.62h3c.53 0 .8-.64.42-1.02L13.88 2.06a.54.54 0 0 0-.76 0zM21 15l-.01 3c0 1.1-.89 2-1.99 2H5c-1.1 0-2-.9-2-2v-3c0-.55.45-1 1-1s1 .45 1 1v3h14v-3c0-.55.45-1 1-1s1 .45 1 1z" />
            </svg>
          </button>
        </div>
      )}

      {showComments && (
        <CommentsPanel mediaId={item.id} onClose={() => setShowComments(false)} />
      )}

      {showShare && (
        <ShareModal mediaId={item.id} legende={item.legende} onClose={() => setShowShare(false)} />
      )}
    </div>
  );
}
