import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, animate, useMotionValue } from "framer-motion";
import Intro from "../components/Intro";
import MediaCard from "../components/MediaCard";
import Lightbox from "../components/Lightbox";
import { getStats, getPublicMedia } from "../lib/api";
import type { AppStats, MediaItem } from "../lib/api";

const INTRO_PLAYED_KEY = "lsdj_intro_played";

function AnimatedCounter({ from, to, duration = 2, delay = 0 }: { from: number; to: number; duration?: number; delay?: number }) {
  const count = useMotionValue(from);
  const [displayValue, setDisplayValue] = useState(from);

  useEffect(() => {
    const timer = setTimeout(() => {
      const controls = animate(count, to, {
        duration: duration,
        ease: "easeOut",
        onUpdate: (latest) => setDisplayValue(Math.round(latest)),
      });
      return () => controls.stop();
    }, delay * 1000);
    return () => clearTimeout(timer);
  }, [count, to, duration, delay]);

  return <motion.span>{displayValue}</motion.span>;
}

function TiltCard({ children, className, to }: { children: React.ReactNode; className: string; to: string }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = (e.clientX - rect.left) / width - 0.5;
    const mouseY = (e.clientY - rect.top) / height - 0.5;
    
    const glareX = ((e.clientX - rect.left) / width) * 100;
    const glareY = ((e.clientY - rect.top) / height) * 100;

    setTilt({
      x: -mouseY * 12, // angles d'inclinaison max 12 deg
      y: mouseX * 12,
      glareX,
      glareY
    });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  return (
    <Link
      to={to}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="perspective-1000 block h-full"
      style={{ textDecoration: "none" }}
    >
      <div
        className={`${className} relative transition-all duration-300 ease-out h-full overflow-hidden`}
        style={{
          transform: isHovered
            ? `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(1.02)`
            : "rotateX(0deg) rotateY(0deg) scale(1)",
          transformStyle: "preserve-3d",
          boxShadow: isHovered
            ? "0 25px 50px -12px rgba(22, 71, 158, 0.15)"
            : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
        }}
      >
        {/* Reflet Glare */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none rounded-2xl z-20 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 60%)`,
            }}
          />
        )}
        <div style={{ transform: "translateZ(30px)", transformStyle: "preserve-3d" }} className="h-full flex flex-col justify-end">
          {children}
        </div>
      </div>
    </Link>
  );
}

export default function Home() {
  const [showIntro, setShowIntro] = useState(
    () => !sessionStorage.getItem(INTRO_PLAYED_KEY)
  );

  const [stats, setStats] = useState<AppStats>({
    years_of_history: 30,
    total_memories: 0,
    total_comments: 0,
  });

  const [recentItems, setRecentItems] = useState<MediaItem[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Erreur lors du chargement des statistiques", err));

    getPublicMedia(1)
      .then((res) => setRecentItems(res.items.slice(0, 4)))
      .catch((err) => console.error("Erreur lors du chargement des photos récentes", err));
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_PLAYED_KEY, "1");
    setShowIntro(false);
  };
  return (
    <>
      {showIntro && <Intro onComplete={handleIntroComplete} />}

      <div className={`min-h-screen bg-creme text-encre transition-opacity duration-700 relative overflow-hidden flex flex-col justify-between ${showIntro ? "opacity-0" : "opacity-100"}`}>
        {/* Cercles de lumière douce en arrière-plan */}
        <div className="absolute w-[600px] h-[600px] bg-bleu/5 rounded-full filter blur-3xl -top-40 -left-40 pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] bg-jaune/5 rounded-full filter blur-3xl -bottom-40 -right-40 pointer-events-none" />
        
        {/* Liseré supérieur bleu et jaune */}
        <div className="h-1.5 bg-gradient-to-r from-bleu via-jaune to-bleu w-full absolute top-0 left-0 z-20" />

        {/* Conteneur principal compact "Above the Fold" */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-6 flex flex-col items-center space-y-6 md:space-y-8 w-full">
          {/* Header/Titre Hero ultra-compact */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 15 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-center space-y-3 max-w-2xl"
          >
            <p className="text-bleu text-[10px] md:text-xs tracking-[0.25em] uppercase font-sans font-semibold">
              Le Silence des Justes
            </p>
            <h1 className="font-serif text-4xl md:text-6xl leading-tight text-encre">
              Une infinité d'histoires
            </h1>
            <div className="flex items-center justify-center gap-3">
              <div className="h-0.5 w-6 bg-jaune" />
              <p className="text-bleu font-serif text-sm md:text-base font-medium tracking-wide">30 ans d'engagement & de partage</p>
              <div className="h-0.5 w-6 bg-jaune" />
            </div>
            <p className="text-slate-500 text-xs md:text-sm max-w-lg mx-auto leading-relaxed font-sans">
              Trois décennies de souvenirs collectifs et de sourires partagés par les familles, les professionnels et les personnes accompagnées au sein de notre association.
            </p>
          </motion.div>

          {/* Statistiques animées intégrées directement en dessous */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 15 : 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-3xl text-center"
          >
            <div className="grid grid-cols-3 gap-2 md:gap-6 bg-white/60 backdrop-blur-md border border-blue-100 rounded-2xl p-4 md:p-5 shadow-sm">
              <div className="space-y-0.5">
                <p className="font-serif text-2xl md:text-4xl text-bleu font-bold">
                  <AnimatedCounter from={0} to={stats.years_of_history} duration={1.8} delay={0.5} />
                </p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">Années d'histoire</p>
              </div>
              <div className="space-y-0.5 border-x border-blue-100/50">
                <p className="font-serif text-2xl md:text-4xl text-bleu font-bold">
                  +<AnimatedCounter from={0} to={stats.total_memories} duration={2} delay={0.7} />
                </p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">Souvenirs partagés</p>
              </div>
              <div className="space-y-0.5">
                <p className="font-serif text-2xl md:text-4xl text-bleu font-bold">
                  +<AnimatedCounter from={0} to={stats.total_comments} duration={2.2} delay={0.9} />
                </p>
                <p className="text-[9px] md:text-[10px] text-slate-400 uppercase tracking-widest font-sans font-semibold">Témoignages</p>
              </div>
            </div>
          </motion.div>

          {/* Deux grandes sections de navigation côte à côte */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 15 : 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="grid md:grid-cols-2 gap-4 md:gap-6 w-full"
          >
            {/* Card Timeline - Light Glass */}
            <TiltCard
              to="/timeline"
              className="group relative bg-white/70 backdrop-blur-md border border-blue-100 rounded-2xl p-6 md:p-8 min-h-[220px] md:min-h-[240px] flex flex-col justify-end hover:bg-white hover:border-bleu/30 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 w-9 h-9 bg-bleu/5 rounded-full flex items-center justify-center border border-blue-50 group-hover:border-bleu/20 transition-colors">
                <svg className="w-4 h-4 text-bleu" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              
              <div className="space-y-2 text-left">
                <p className="text-bleu text-[10px] tracking-wider uppercase font-semibold">1996 → 2026</p>
                <h2 className="font-serif text-lg md:text-2xl text-encre group-hover:text-bleu transition-colors">Fresque Chronologique</h2>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-sm">
                  Revivez l'histoire de l'association. Parcourez 30 ans d'événements, d'inaugurations et de victoires collectives classés par année.
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-bleu text-xs font-semibold group-hover:gap-3 transition-all duration-300">
                  Explorer la timeline
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </TiltCard>

            {/* Card Galerie - Light Glass */}
            <TiltCard
              to="/galerie"
              className="group relative bg-white/70 backdrop-blur-md border border-blue-100 rounded-2xl p-6 md:p-8 min-h-[220px] md:min-h-[240px] flex flex-col justify-end hover:bg-white hover:border-bleu/30 transition-all duration-300"
            >
              <div className="absolute top-4 right-4 w-9 h-9 bg-bleu/5 rounded-full flex items-center justify-center border border-blue-50 group-hover:border-bleu/20 transition-colors">
                <svg className="w-4 h-4 text-bleu" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
              </div>

              <div className="space-y-2 text-left">
                <p className="text-bleu text-[10px] tracking-wider uppercase font-semibold">Mémoire intemporelle</p>
                <h2 className="font-serif text-lg md:text-2xl text-encre group-hover:text-bleu transition-colors">Galerie Infinie</h2>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed max-w-sm">
                  Laissez-vous porter par les éclats de rire et les moments de partage capturés au quotidien. Une immersion visuelle sans repère de temps.
                </p>
                <span className="inline-flex items-center gap-1.5 mt-2 text-bleu text-xs font-semibold group-hover:gap-3 transition-all duration-300">
                  Voir la galerie
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </TiltCard>
          </motion.div>
        </div>

        {/* Aperçu des photos récentes */}
        {recentItems.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto px-6 pb-24 relative z-10 text-center space-y-10"
          >
            <div className="space-y-2">
              <p className="text-bleu text-xs tracking-widest uppercase font-semibold">Instants partagés</p>
              <h2 className="font-serif text-3xl text-encre">Récemment ajoutés sur le mur</h2>
              <div className="h-0.5 w-12 bg-jaune mx-auto mt-3" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
              {recentItems.map((item, idx) => (
                <MediaCard
                  key={item.id}
                  item={item}
                  onClick={() => setLightboxIndex(idx)}
                />
              ))}
            </div>

            <div className="pt-4">
              <Link
                to="/galerie"
                className="inline-flex items-center gap-2 border border-bleu/30 text-bleu hover:bg-bleu hover:text-white px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 shadow-sm"
              >
                Explorer toute la galerie
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </motion.section>
        )}

        {/* Footer */}
        <footer className="text-center py-10 border-t border-blue-100/55 relative z-10">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <div className="h-px w-8 bg-jaune" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-bleu/80">Le Silence des Justes · 1996 – 2026</span>
            <div className="h-px w-8 bg-jaune" />
          </div>
        </footer>
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          items={recentItems}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIndex((i) => Math.min(recentItems.length - 1, (i ?? 0) + 1))}
        />
      )}
    </>
  );
}
