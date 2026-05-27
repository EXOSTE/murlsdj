import { useState, useEffect, useCallback } from "react";
import MasonryGrid from "../components/MasonryGrid";
import Lightbox from "../components/Lightbox";
import CinematicShow from "../components/CinematicShow";
import { getPublicMedia } from "../lib/api";
import type { MediaItem } from "../lib/api";
import { Link, useSearchParams } from "react-router-dom";

export default function Gallery() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showCinematic, setShowCinematic] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "photo" | "video">("all");

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);
    try {
      const res = await getPublicMedia(page);
      setItems((prev) => [...prev, ...res.items]);
      setHasMore(res.has_more);
      setPage((p) => p + 1);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading, hasMore]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.legende
      ? item.legende.toLowerCase().includes(searchQuery.toLowerCase())
      : false;
    const matchesType = filterType === "all" || item.type === filterType;
    return (searchQuery ? matchesSearch : true) && matchesType;
  });

  // Deep linking effects
  useEffect(() => {
    if (lightboxIndex !== null && filteredItems[lightboxIndex]) {
      setSearchParams({ media: filteredItems[lightboxIndex].id }, { replace: true });
    } else {
      if (searchParams.has("media")) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("media");
        setSearchParams(newParams, { replace: true });
      }
    }
  }, [lightboxIndex, filteredItems, searchParams, setSearchParams]);

  const mediaIdFromUrl = searchParams.get("media");
  useEffect(() => {
    if (mediaIdFromUrl && items.length > 0) {
      const idx = filteredItems.findIndex((item) => item.id === mediaIdFromUrl);
      if (idx !== -1) {
        setLightboxIndex(idx);
      } else {
        const idxAll = items.findIndex((item) => item.id === mediaIdFromUrl);
        if (idxAll !== -1) {
          setSearchQuery("");
          setFilterType("all");
        } else {
          // Fetch from backend
          import("../lib/api").then(({ getSingleMedia }) => {
            getSingleMedia(mediaIdFromUrl)
              .then((media) => {
                setItems((prev) => {
                  if (prev.some((x) => x.id === media.id)) return prev;
                  return [media, ...prev];
                });
                setSearchQuery("");
                setFilterType("all");
              })
              .catch((err) => {
                console.error("Failed to load deep-linked media", err);
              });
          });
        }
      }
    }
  }, [mediaIdFromUrl, items.length]);

  return (
    <div className="min-h-screen bg-creme">
      {/* Header */}
      <header className="border-b border-blue-100 bg-white px-6 py-5 flex items-center justify-between">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 bg-jaune rounded-full" />
            <Link to="/" className="font-serif text-encre text-xl hover:text-bleu transition-colors">
              Mur LSDJ
            </Link>
          </div>
          <nav className="flex gap-6 text-sm text-slate-400">
            <Link to="/timeline" className="hover:text-bleu transition-colors">
              Timeline
            </Link>
            <Link to="/galerie" className="text-bleu font-medium">
              Galerie
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl text-encre mb-2">Galerie</h1>
            <p className="text-slate-400 text-sm">Une infinité d'histoires et de moments partagés</p>
          </div>
          {filteredItems.length > 0 && (
            <button
              onClick={() => setShowCinematic(true)}
              className="inline-flex items-center justify-center gap-2 bg-bleu text-white px-5 py-3 rounded-xl font-medium text-sm hover:bg-encre hover:shadow-lg hover:shadow-bleu/10 transition-all duration-300 self-start sm:self-auto"
            >
              <svg className="w-5 h-5 text-jaune animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              Lancer le Diaporama Événementiel
            </button>
          )}
        </div>

        {/* Filtres & Recherche */}
        <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-blue-50 p-4 rounded-2xl shadow-sm">
          {/* Recherche */}
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Rechercher un souvenir (ex: sortie, anniversaire...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-creme border border-blue-50/50 rounded-xl pl-10 pr-4 py-2.5 text-xs text-encre placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-bleu"
            />
          </div>

          {/* Filtre Type */}
          <div className="flex gap-1 bg-creme p-1 rounded-xl border border-blue-50/50 self-start md:self-auto">
            <button
              onClick={() => setFilterType("all")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === "all" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
              }`}
            >
              Tout
            </button>
            <button
              onClick={() => setFilterType("photo")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === "photo" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
              }`}
            >
              Photos
            </button>
            <button
              onClick={() => setFilterType("video")}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterType === "video" ? "bg-bleu text-white shadow-sm" : "text-slate-500 hover:text-bleu"
              }`}
            >
              Vidéos
            </button>
          </div>
        </div>

        {items.length === 0 && isLoading ? (
          /* Skeletons Shimmer Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-blue-50 rounded-xl p-3 space-y-3 animate-pulse">
                <div className="bg-slate-200 h-64 rounded-lg w-full" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">
            Aucun souvenir ne correspond à vos critères de recherche.
          </div>
        ) : (
          <MasonryGrid
            items={filteredItems}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoading={isLoading}
            onMediaClick={setLightboxIndex}
          />
        )}
      </main>

      {lightboxIndex !== null && (
        <Lightbox
          items={filteredItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(filteredItems.length - 1, (i ?? 0) + 1))}
        />
      )}

      {showCinematic && (
        <CinematicShow
          items={filteredItems}
          onClose={() => setShowCinematic(false)}
        />
      )}
    </div>
  );
}
