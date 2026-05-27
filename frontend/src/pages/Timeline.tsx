import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import MediaCard from "../components/MediaCard";
import Lightbox from "../components/Lightbox";
import CinematicShow from "../components/CinematicShow";
import { getTimeline, getPublicMedia } from "../lib/api";
import type { MediaItem } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface YearEntry {
  annee: number;
  count: number;
}

const listVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export default function Timeline() {
  const [years, setYears] = useState<YearEntry[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showCinematic, setShowCinematic] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    getTimeline().then((data) => {
      setYears(data);
      // Ne sélectionner l'année par défaut que s'il n'y a pas déjà de média demandé dans l'URL
      if (!searchParams.get("media") && data.length > 0) {
        setSelectedYear(data[0].annee);
      }
    });
  }, []);

  useEffect(() => {
    if (!selectedYear) return;
    setLoadingItems(true);
    getPublicMedia(1, selectedYear)
      .then((res) => setItems(res.items))
      .finally(() => setLoadingItems(false));
  }, [selectedYear]);

  // Synchroniser l'URL avec l'élément affiché de la Lightbox
  useEffect(() => {
    if (lightboxIndex !== null && items[lightboxIndex]) {
      setSearchParams({ media: items[lightboxIndex].id }, { replace: true });
    } else {
      if (searchParams.has("media")) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("media");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [lightboxIndex, items, searchParams, setSearchParams]);

  const mediaIdFromUrl = searchParams.get("media");
  useEffect(() => {
    if (mediaIdFromUrl) {
      const idx = items.findIndex((x) => x.id === mediaIdFromUrl);
      if (idx !== -1) {
        setLightboxIndex(idx);
      } else {
        // Fetch le média du backend pour connaître son année et l'activer
        import("../lib/api").then(({ getSingleMedia }) => {
          getSingleMedia(mediaIdFromUrl)
            .then((media) => {
              if (media.annee) {
                setSelectedYear(media.annee);
              }
            })
            .catch((err) => {
              console.error("Failed to load deep-linked media in Timeline", err);
            });
        });
      }
    }
  }, [mediaIdFromUrl, items]);

  return (
    <div className="min-h-screen bg-creme">
      {/* Header */}
      <header className="border-b border-blue-100 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-1 h-6 bg-jaune rounded-full" />
          <Link to="/" className="font-serif text-encre text-xl hover:text-bleu transition-colors">
            Mur LSDJ
          </Link>
        </div>
        <nav className="flex gap-6 text-sm text-slate-400">
          <Link to="/timeline" className="text-bleu font-medium">
            Timeline
          </Link>
          <Link to="/galerie" className="hover:text-bleu transition-colors">
            Galerie
          </Link>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row gap-8">
        {/* Sidebar années */}
        <aside className="w-full md:w-24 shrink-0">
          <h2 className="text-xs text-slate-400 uppercase tracking-widest mb-3 md:mb-4">Années</h2>
          <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 scrollbar-none snap-x snap-mandatory">
            {years.map((y) => (
              <button
                key={y.annee}
                onClick={() => setSelectedYear(y.annee)}
                className={`snap-center shrink-0 text-center md:text-left py-1.5 px-3 md:px-2 rounded-lg text-sm transition-colors border md:border-0 ${
                  selectedYear === y.annee
                    ? "bg-bleu text-white font-medium border-bleu"
                    : "text-slate-400 hover:text-bleu hover:bg-blue-50 bg-white md:bg-transparent border-blue-50"
                }`}
              >
                {y.annee}
                <span className={`ml-1 text-xs ${selectedYear === y.annee ? "text-blue-200" : "text-slate-400"}`}>
                  ({y.count})
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* Grille de médias */}
        <main className="flex-1">
          {years.length === 0 ? (
            <div className="text-center py-20 text-stone-300 text-sm">
              Aucun souvenir daté pour l'instant.
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-baseline justify-between gap-3 flex-wrap">
                <div className="flex items-baseline gap-3">
                  <h1 className="font-serif text-4xl text-encre">{selectedYear}</h1>
                  <p className="text-slate-400 text-sm">
                    {items.length} souvenir{items.length > 1 ? "s" : ""}
                  </p>
                </div>
                {items.length > 0 && (
                  <button
                    onClick={() => setShowCinematic(true)}
                    className="inline-flex items-center justify-center gap-2 bg-bleu text-white px-4 py-2.5 rounded-xl font-medium text-xs hover:bg-encre hover:shadow-lg hover:shadow-bleu/10 transition-all duration-300"
                  >
                    <svg className="w-4 h-4 text-jaune animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Lancer le Diaporama ({selectedYear})
                  </button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {loadingItems ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-stone-300 text-sm py-10 text-center animate-pulse"
                  >
                    Chargement…
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedYear}
                    variants={listVariants}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
                  >
                    {items.map((item, i) => (
                      <MediaCard key={item.id} item={item} onClick={() => setLightboxIndex(i)} />
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={items}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(items.length - 1, (i ?? 0) + 1))}
        />
      )}

      {showCinematic && (
        <CinematicShow
          items={items}
          onClose={() => setShowCinematic(false)}
        />
      )}
    </div>
  );
}
