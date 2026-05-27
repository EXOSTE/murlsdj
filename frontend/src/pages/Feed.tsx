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
  const loadingRef = useRef(false);
  const initialMediaId = searchParams.get("media");

  const loadPage = useCallback(async (p: number) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await getPublicMedia(p, undefined);
      setItems((prev) => (p === 1 ? res.items : [...prev, ...res.items]));
      setHasMore(res.has_more);
      setPage(p);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
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
        <header className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <span className="font-serif text-white text-lg tracking-wide drop-shadow pointer-events-none">
            Mur LSDJ
          </span>
          <nav className="flex items-center gap-4 pointer-events-auto">
            <Link to="/galerie" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Galerie
            </Link>
            <Link to="/timeline" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Timeline
            </Link>
            <Link to="/histoire" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">
              Histoire
            </Link>
            <Link
              to="/contribuer"
              className="bg-white/15 hover:bg-white/25 text-white text-xs uppercase tracking-widest transition-colors px-3 py-1.5 rounded-full border border-white/20"
            >
              + Publier
            </Link>
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

      {/* Feed */}
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-scroll"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {items.map((item, idx) => (
          <div
            key={item.id}
            className="w-full h-dvh flex-shrink-0"
            style={{ scrollSnapAlign: "start" }}
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
