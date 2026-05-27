import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { getPublicMedia, getPopularMedia } from "../lib/api";
import type { MediaItem } from "../lib/api";
import FeedSlide from "../components/FeedSlide";

interface FeedProps {
  popular?: boolean;
}

export default function Feed({ popular = false }: FeedProps) {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isKiosk, setIsKiosk] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const kioskTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const loadingRef = useRef(false);
  const initialMediaId = popular ? null : searchParams.get("media");

  const loadPage = useCallback(async (p: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = popular ? await getPopularMedia(p) : await getPublicMedia(p, undefined);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.has_more);
      setPage(p);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [popular]);

  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    loadPage(1);
  }, [loadPage]);

  // Deep link : scroll vers le bon média au premier chargement
  useEffect(() => {
    if (!initialMediaId || items.length === 0) return;
    const idx = items.findIndex((i) => i.id === initialMediaId);
    if (idx !== -1) {
      setActiveIndex(idx);
      const slide = containerRef.current?.children[idx] as HTMLElement;
      slide?.scrollIntoView({ behavior: "instant" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMediaId, items.length]);

  // IntersectionObserver pour détecter la slide active
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

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
    if (hasMore && !loadingRef.current && activeIndex >= items.length - 3 && items.length > 0) {
      loadPage(page + 1);
    }
  }, [activeIndex, items.length, hasMore, page, loadPage]);

  // Mode kiosque
  const enterKiosk = async () => {
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // Fullscreen non supporté
    }
    setIsKiosk(true);
  };

  const exitKiosk = useCallback(() => {
    setIsKiosk(false);
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    if (kioskTimer.current) {
      clearInterval(kioskTimer.current);
      kioskTimer.current = null;
    }
  }, []);

  useEffect(() => {
    if (!isKiosk) return;

    const activeIndexRef = { current: activeIndex };

    kioskTimer.current = setInterval(() => {
      const container = containerRef.current;
      if (!container || items.length === 0) return;
      activeIndexRef.current = (activeIndexRef.current + 1) % items.length;
      const slide = container.children[activeIndexRef.current] as HTMLElement;
      slide?.scrollIntoView({ behavior: "smooth" });
    }, 3000);

    const handleExit = () => exitKiosk();
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) exitKiosk();
    };

    document.addEventListener("keydown", handleExit);
    document.addEventListener("click", handleExit);
    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      if (kioskTimer.current) {
        clearInterval(kioskTimer.current);
        kioskTimer.current = null;
      }
      document.removeEventListener("keydown", handleExit);
      document.removeEventListener("click", handleExit);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isKiosk, items.length, exitKiosk]);

  return (
    <div className="relative w-screen h-dvh bg-black overflow-hidden">
      {/* Header */}
      {!isKiosk && (
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <span className="font-serif text-white text-base tracking-wide drop-shadow pointer-events-none shrink-0">
            Mur LSDJ
          </span>
          <nav className="flex items-center gap-2 pointer-events-auto">
            {/* Récent / Populaire toggle */}
            <div className="flex items-center bg-white/10 rounded-full border border-white/20 overflow-hidden">
              <Link
                to="/"
                className={`px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors ${!popular ? "bg-white/20 text-white font-semibold" : "text-white/70"}`}
              >
                Récent
              </Link>
              <Link
                to="/populaire"
                className={`flex items-center gap-1 px-2.5 py-1 text-[10px] uppercase tracking-widest transition-colors ${popular ? "bg-white/20 text-white font-semibold" : "text-white/70"}`}
              >
                <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current shrink-0"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
                <span className="hidden sm:inline">Populaire</span>
              </Link>
            </div>
            <Link to="/galerie" className="hidden sm:block text-white/70 hover:text-white text-[10px] uppercase tracking-widest transition-colors">
              Galerie
            </Link>
            <Link
              to="/contribuer"
              className="bg-white/15 hover:bg-white/25 text-white text-[10px] uppercase tracking-widest transition-colors px-2.5 py-1.5 rounded-full border border-white/20 shrink-0"
            >
              + Publier
            </Link>
            <button
              onClick={enterKiosk}
              className="text-white/60 hover:text-white transition-colors shrink-0"
              title="Mode kiosque"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-9h2V3h-7v2h5z" />
              </svg>
            </button>
          </nav>
        </header>
      )}

      {/* Badge mode populaire */}
      {popular && !isKiosk && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-10 bg-white/10 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full border border-white/20">
          🔥 Top souvenirs
        </div>
      )}

      {/* Feed */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll"
        style={{
          scrollSnapType: "y mandatory",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch" as never,
        }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="w-full h-dvh flex-shrink-0"
            style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
          >
            <FeedSlide item={item} isActive={idx === activeIndex} isKiosk={isKiosk} />
          </div>
        ))}

        {loading && (
          <div className="w-full h-dvh flex items-center justify-center" style={{ scrollSnapAlign: "start" }}>
            <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <div className="w-full h-dvh flex flex-col items-center justify-center gap-4" style={{ scrollSnapAlign: "start" }}>
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
