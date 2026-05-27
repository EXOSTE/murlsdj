import { useEffect, useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem, CommentItem } from "../lib/api";
import { getComments, createComment } from "../lib/api";

interface LightboxProps {
  items: MediaItem[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function Lightbox({ items, currentIndex, onClose, onPrev, onNext }: LightboxProps) {
  const item = items[currentIndex];

  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [submitState, setSubmitState] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState("");
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = () => {
    if (!item) return;
    const url = `${window.location.origin}${window.location.pathname}?media=${item.id}`;
    navigator.clipboard.writeText(url);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  const loadComments = useCallback(async () => {
    if (!item) return;
    setCommentsLoading(true);
    try {
      const data = await getComments(item.id);
      setComments(data);
    } catch (err) {
      console.error("Failed to load comments", err);
    } finally {
      setCommentsLoading(false);
    }
  }, [item]);

  useEffect(() => {
    if (showComments && item) {
      loadComments();
    }
  }, [showComments, item, loadComments]);

  // Réinitialiser les états lors du changement de média
  useEffect(() => {
    setAuthor("");
    setContent("");
    setSubmitState("idle");
    setSubmitError("");
    if (showComments) {
      loadComments();
    }
  }, [currentIndex, showComments, loadComments]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !content.trim() || !item) return;
    setSubmitState("submitting");
    setSubmitError("");
    try {
      await createComment(item.id, author.trim(), content.trim());
      setSubmitState("success");
      setAuthor("");
      setContent("");
      setTimeout(() => setSubmitState("idle"), 4000);
    } catch (err: any) {
      setSubmitState("error");
      setSubmitError(err?.response?.data?.detail || "Une erreur est survenue.");
    }
  };

  if (!item) return null;

  let touchStartX = 0;
  let touchEndX = 0;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    const threshold = 50;
    if (diff > threshold) {
      onNext();
    } else if (diff < -threshold) {
      onPrev();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        key="lightbox"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-encre/98 flex flex-col md:flex-row items-stretch select-none"
        onClick={onClose}
      >
        {/* Panneau Principal Média */}
        <div 
          className="flex-1 flex flex-col items-center justify-center relative p-8 md:p-12"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* Actions supérieures */}
          <div className="absolute top-4 right-5 flex items-center gap-3 z-30" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowComments(!showComments)}
              className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold py-2.5 px-4 rounded-xl border transition-all duration-300 ${
                showComments
                  ? "bg-jaune text-encre border-jaune shadow-lg shadow-jaune/10"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.077.598.598 0 0 1-.165-.63l.81-2.43A8.25 8.25 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
              Livre d'or
            </button>
            <button
              onClick={handleShare}
              className={`flex items-center gap-2 text-xs uppercase tracking-wider font-semibold py-2.5 px-4 rounded-xl border transition-all duration-300 ${
                shareCopied
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-600/10"
                  : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white"
              }`}
            >
              {shareCopied ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                  Copié !
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186l5.566-2.783m-5.566 4.969l5.566 2.783m0 0a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185zm-5.566-8.225a2.25 2.25 0 1 1 3.933 2.185 2.25 2.25 0 0 1-3.933-2.185z" />
                  </svg>
                  Partager
                </>
              )}
            </button>
            <button
              className="text-white/60 hover:text-white text-3xl leading-none font-light bg-white/5 rounded-full w-9 h-9 flex items-center justify-center border border-white/10 hover:bg-white/10 transition-colors"
              onClick={onClose}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>

          {/* Compteur */}
          <span className="absolute top-5 left-5 text-white/40 text-sm font-medium">
            {currentIndex + 1} / {items.length}
          </span>

          {/* Média */}
          <div
            className="max-w-5xl max-h-[70vh] md:max-h-[80vh] w-full flex items-center justify-center relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              {item.type === "video" ? (
                <motion.video
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  src={item.file_url}
                  controls
                  autoPlay
                  className="max-h-[65vh] md:max-h-[75vh] max-w-full rounded-xl shadow-2xl z-10"
                />
              ) : (
                <motion.img
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  src={item.file_url}
                  alt={item.legende ?? ""}
                  className="max-h-[65vh] md:max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl z-10"
                />
              )}
            </AnimatePresence>
            
            {/* Lueur de fond */}
            {item.type === "photo" && (
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-20 scale-105 pointer-events-none z-0"
                style={{ backgroundImage: `url(${item.file_url})` }}
              />
            )}
          </div>

          {/* Légende bas de page */}
          {(item.legende || item.date_prise) && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center px-6 max-w-xl z-10">
              {item.legende && (
                <p className="text-white/90 text-sm md:text-base font-serif leading-relaxed drop-shadow">
                  {item.legende}
                </p>
              )}
              {item.date_prise && (
                <p className="text-jaune/85 text-xs tracking-wider uppercase font-semibold mt-2">
                  {new Date(item.date_prise).toLocaleDateString("fr-FR", {
                    year: "numeric",
                    month: "long",
                  })}
                </p>
              )}
            </div>
          )}

          {/* Flèches de navigation */}
          {currentIndex > 0 && (
            <button
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); onPrev(); }}
              aria-label="Précédent"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          {currentIndex < items.length - 1 && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-3 bg-white/5 rounded-full border border-white/5 hover:bg-white/10 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); onNext(); }}
              aria-label="Suivant"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Tiroir Commentaires */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="w-full md:w-[400px] border-l border-blue-100 bg-white/95 backdrop-blur-lg flex flex-col h-full relative z-20"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header tiroir */}
              <div className="p-6 border-b border-blue-100 flex justify-between items-center shrink-0">
                <h3 className="font-serif text-lg text-bleu flex items-center gap-2">
                  <svg className="w-5 h-5 text-bleu" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a.598.598 0 0 1-.655-.077.598.598 0 0 1-.165-.63l.81-2.43A8.25 8.25 0 0 1 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                  Témoignages
                </h3>
                <button
                  onClick={() => setShowComments(false)}
                  className="text-slate-400 hover:text-bleu text-xs uppercase tracking-wider font-semibold"
                >
                  Fermer
                </button>
              </div>

              {/* Liste commentaires */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-none">
                {commentsLoading ? (
                  <p className="text-slate-400 text-center py-10 text-sm animate-pulse">Chargement des messages...</p>
                ) : comments.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 space-y-2">
                    <p className="text-sm">Aucun témoignage pour l'instant.</p>
                    <p className="text-xs">Soyez le premier à partager un souvenir lié à ce média !</p>
                  </div>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-creme border border-blue-50/50 rounded-xl p-4 space-y-2 shadow-sm">
                      <div className="flex justify-between items-baseline">
                        <span className="text-bleu text-xs font-semibold">{c.author}</span>
                        <span className="text-slate-400 text-[10px]">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                      <p className="text-encre text-xs leading-relaxed font-sans">{c.content}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Formulaire ajout */}
              <div className="p-6 border-t border-blue-100 bg-creme/50 shrink-0">
                <h4 className="text-xs text-bleu uppercase tracking-wider font-semibold mb-3">Laisser un message</h4>
                
                {submitState === "success" ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center text-xs text-emerald-800">
                    Merci ! Votre message est enregistré et apparaîtra après validation.
                  </div>
                ) : (
                  <form onSubmit={handleCommentSubmit} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Votre nom / pseudo"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      maxLength={100}
                      required
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-encre placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bleu focus:border-bleu shadow-sm"
                    />
                    <textarea
                      placeholder="Votre témoignage, souvenir..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      maxLength={300}
                      required
                      rows={3}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-encre placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bleu focus:border-bleu resize-none shadow-sm"
                    />
                    <p className="text-[10px] text-right text-slate-400">{content.length}/300</p>
                    
                    {submitState === "error" && (
                      <p className="text-red-400 text-[10px] text-center">{submitError}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitState === "submitting" || !author.trim() || !content.trim()}
                      className="w-full bg-bleu hover:bg-encre text-white font-semibold py-2.5 rounded-xl text-xs transition-colors shadow-md shadow-bleu/10 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {submitState === "submitting" ? "Envoi en cours..." : "Publier mon message"}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
