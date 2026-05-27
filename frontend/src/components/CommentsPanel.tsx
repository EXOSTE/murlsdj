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
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />

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
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 bg-slate-200 rounded-full" />
          </div>

          <div className="flex items-center justify-between px-5 pb-3 border-b border-slate-100 shrink-0">
            <h3 className="font-serif text-encre text-base">
              Commentaires {comments.length > 0 && `(${comments.length})`}
            </h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">×</button>
          </div>

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
