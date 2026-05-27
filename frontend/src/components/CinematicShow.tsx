import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MediaItem } from "../lib/api";

interface CinematicShowProps {
  items: MediaItem[];
  onClose: () => void;
}

export default function CinematicShow({ items, onClose }: CinematicShowProps) {
  const [index, setIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const activeItem = items[index];

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
      if (!isMuted) {
        audioRef.current.play().catch((err) => console.log("Audio autoplay block:", err));
      }
    }
  }, [isMuted]);

  const handleNext = () => {
    setIndex((prev) => (prev + 1) % items.length);
  };

  const handlePrev = () => {
    setIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  useEffect(() => {
    if (!activeItem) return;

    if (activeItem.type === "photo") {
      const timer = setTimeout(handleNext, 6000);
      return () => clearTimeout(timer);
    }
  }, [index, activeItem]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none">
      <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent z-10">
        <div>
          <h2 className="text-yellow-400 text-xs tracking-widest uppercase font-semibold">Mode Cinématique · 30 ans</h2>
          <p className="text-white text-sm font-serif">Mur LSDJ — Souvenirs partagés</p>
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 border border-white/10 transition-colors"
          title="Fermer (Échap)"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center relative w-full h-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full flex items-center justify-center"
          >
            {activeItem.type === "video" ? (
              <video
                ref={videoRef}
                src={activeItem.file_url}
                autoPlay
                muted
                onEnded={handleNext}
                className="w-full h-full object-contain max-h-[85vh] z-10"
              />
            ) : (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ scale: 1.06 }}
                transition={{ duration: 6, ease: "linear" }}
                className="w-full h-full flex items-center justify-center"
              >
                <img
                  src={activeItem.file_url}
                  alt=""
                  className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl z-10"
                />
              </motion.div>
            )}

            {activeItem.type === "photo" && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-35 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${activeItem.file_url})` }}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 flex flex-col items-center gap-4 text-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.8 }}
            className="max-w-2xl space-y-2"
          >
            {activeItem.legende && (
              <p className="text-white text-lg md:text-xl font-serif leading-relaxed drop-shadow-md">
                "{activeItem.legende}"
              </p>
            )}
            {activeItem.date_prise && (
              <p className="text-yellow-400 text-xs tracking-wider uppercase font-semibold">
                {new Date(activeItem.date_prise).toLocaleDateString("fr-FR", { year: "numeric", month: "long" })}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex items-center gap-6 mt-2">
          <button
            onClick={handlePrev}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <span className="text-white/40 text-xs tracking-widest uppercase">
            {index + 1} / {items.length}
          </span>

          <button
            onClick={handleNext}
            className="text-white/40 hover:text-white transition-colors"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Contrôle Musique */}
        <div className="mt-4">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl border border-white/10 transition-colors"
            title={isMuted ? "Activer la musique d'ambiance" : "Couper la musique d'ambiance"}
          >
            {isMuted ? (
              <>
                <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6L4.5 9H1.5v6h3l4.5 3.75V5.25z" />
                </svg>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-white/60">Musique désactivée</span>
              </>
            ) : (
              <>
                <div className="flex items-end gap-[2px] h-3 w-4">
                  <span className="w-[3px] bg-jaune rounded-full animate-bounce" style={{ animationDuration: "0.8s" }} />
                  <span className="w-[3px] bg-jaune rounded-full animate-bounce" style={{ animationDuration: "0.5s", animationDelay: "0.15s" }} />
                  <span className="w-[3px] bg-jaune rounded-full animate-bounce" style={{ animationDuration: "0.7s", animationDelay: "0.3s" }} />
                  <span className="w-[3px] bg-jaune rounded-full animate-bounce" style={{ animationDuration: "0.6s", animationDelay: "0.1s" }} />
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-jaune">Musique active</span>
              </>
            )}
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src="https://www.chosic.com/wp-content/uploads/2021/07/Warm-Memories-Emotional-Inspiring-Piano.mp3"
        loop
      />
    </div>
  );
}
