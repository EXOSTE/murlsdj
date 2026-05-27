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
  const wheelCooldown = useRef(false);
  const activeIndexRef = useRef(0);
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

  // Garde activeIndexRef synchronisé pour la molette
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Charger plus quand il reste 3 slides
  useEffect(() => {
    if (hasMore && !loadingRef.current && activeIndex >= items.length - 3 && items.length > 0) {
      loadPage(page + 1);
    }
  }, [activeIndex, items.length, hasMore, page, loadPage]);

  // Molette desktop : avancer d'un slide à la fois
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelCooldown.current) return;

      const direction = e.deltaY > 0 ? 1 : -1;
      const next = Math.max(0, Math.min(activeIndexRef.current + direction, container.children.length - 1));
      const slide = container.children[next] as HTMLElement;
      slide?.scrollIntoView({ behavior: "smooth" });

      wheelCooldown.current = true;
      setTimeout(() => { wheelCooldown.current = false; }, 700);
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => container.removeEventListener("wheel", onWheel);
  }, []);

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
      {/* Header desktop (sm+) */}
      {!isKiosk && (
        <header className="absolute top-0 left-0 right-0 z-20 hidden sm:flex items-center justify-between px-5 py-4 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <span className="font-serif text-white text-lg tracking-wide drop-shadow pointer-events-none shrink-0">
            Mur LSDJ
          </span>
          <nav className="flex items-center gap-4 pointer-events-auto">
            <Link to="/" className={`text-xs uppercase tracking-widest transition-colors ${!popular ? "text-white font-semibold" : "text-white/70 hover:text-white"}`}>
              Récent
            </Link>
            <Link to="/populaire" className={`flex items-center gap-1 text-xs uppercase tracking-widest transition-colors ${popular ? "text-white font-semibold" : "text-white/70 hover:text-white"}`}>
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current"><path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></svg>
              Populaire
            </Link>
            <Link to="/galerie" className="text-white/70 hover:text-white text-xs uppercase tracking-widest transition-colors">Galerie</Link>
            <Link to="/contribuer" className="bg-white/15 hover:bg-white/25 text-white text-xs uppercase tracking-widest transition-colors px-3 py-1.5 rounded-full border border-white/20">
              + Publier
            </Link>
            <button onClick={enterKiosk} className="text-white/60 hover:text-white transition-colors" title="Mode kiosque">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-9h2V3h-7v2h5z" /></svg>
            </button>
          </nav>
        </header>
      )}

      {/* Header mobile — titre seul */}
      {!isKiosk && (
        <header className="absolute top-0 left-0 right-0 z-20 flex sm:hidden items-center justify-between px-4 py-3 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
          <span className="font-serif text-white text-base tracking-wide drop-shadow">Mur LSDJ</span>
          <button onClick={enterKiosk} className="text-white/60 hover:text-white transition-colors pointer-events-auto" title="Mode kiosque">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current"><path d="M5 5h5V3H3v7h2zm5 14H5v-5H3v7h7zm11-5h-2v5h-5v2h7zm-2-9h2V3h-7v2h5z" /></svg>
          </button>
        </header>
      )}

      {/* Bottom nav mobile */}
      {!isKiosk && (
        <nav className="absolute bottom-0 left-0 right-0 z-20 flex sm:hidden items-center justify-around px-2 pb-safe bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
          <Link to="/" className={`flex flex-col items-center gap-1 py-3 px-4 pointer-events-auto transition-colors ${!popular ? "text-white" : "text-white/50"}`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
            </svg>
            <span className="text-[9px] uppercase tracking-widest">Récent</span>
          </Link>

          <Link to="/populaire" className={`flex flex-col items-center gap-1 py-3 px-4 pointer-events-auto transition-colors ${popular ? "text-white" : "text-white/50"}`}>
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M13.5 0.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/>
            </svg>
            <span className="text-[9px] uppercase tracking-widest">Populaire</span>
          </Link>

          <Link to="/contribuer" className="flex flex-col items-center gap-1 py-2 px-4 pointer-events-auto">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-black">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
              </svg>
            </div>
          </Link>

          <Link to="/galerie" className="flex flex-col items-center gap-1 py-3 px-4 pointer-events-auto text-white/50 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z"/>
            </svg>
            <span className="text-[9px] uppercase tracking-widest">Galerie</span>
          </Link>

          <Link to="/histoire" className="flex flex-col items-center gap-1 py-3 px-4 pointer-events-auto text-white/50 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
            </svg>
            <span className="text-[9px] uppercase tracking-widest">À propos</span>
          </Link>
        </nav>
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
