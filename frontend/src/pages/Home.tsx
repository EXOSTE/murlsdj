import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, animate, useMotionValue, useTransform } from "framer-motion";
import Intro from "../components/Intro";
import { getStats } from "../lib/api";
import type { AppStats } from "../lib/api";

const INTRO_PLAYED_KEY = "lsdj_intro_played";

function AnimatedCounter({ from, to, duration = 2, delay = 0 }: { from: number; to: number; duration?: number; delay?: number }) {
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));
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

  useEffect(() => {
    getStats()
      .then((data) => setStats(data))
      .catch((err) => console.error("Erreur lors du chargement des statistiques", err));
  }, []);

  const handleIntroComplete = () => {
    sessionStorage.setItem(INTRO_PLAYED_KEY, "1");
    setShowIntro(false);
  };

  return (
    <>
      {showIntro && <Intro onComplete={handleIntroComplete} />}

      <div className={`min-h-screen bg-creme text-encre transition-opacity duration-700 relative overflow-hidden ${showIntro ? "opacity-0" : "opacity-100"}`}>
        {/* Cercles de lumière douce en arrière-plan */}
        <div className="absolute w-[600px] h-[600px] bg-bleu/5 rounded-full filter blur-3xl -top-40 -left-40 pointer-events-none" />
        <div className="absolute w-[600px] h-[600px] bg-jaune/5 rounded-full filter blur-3xl -bottom-40 -right-40 pointer-events-none" />
        
        {/* Liseré supérieur bleu et jaune */}
        <div className="h-1.5 bg-gradient-to-r from-bleu via-jaune to-bleu w-full absolute top-0 left-0 z-20" />

        {/* Hero */}
        <section className="flex flex-col items-center justify-center min-h-screen text-center px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: showIntro ? 0 : 1, y: showIntro ? 24 : 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="space-y-6 max-w-2xl"
          >
            <p className="text-bleu text-xs tracking-[0.25em] uppercase font-sans font-semibold">
              Le Silence des Justes
            </p>
            <h1 className="font-serif text-5xl md:text-8xl leading-tight text-encre">
              Une infinité<br />d'histoires
            </h1>
            <div className="flex items-center justify-center gap-4">
              <div className="h-0.5 w-10 bg-jaune" />
              <p className="text-bleu font-serif text-lg md:text-xl font-medium tracking-wide">30 ans d'engagement & de partage</p>
              <div className="h-0.5 w-10 bg-jaune" />
            </div>
            <p className="text-slate-500 text-sm md:text-base max-w-lg mx-auto leading-relaxed font-sans">
              Trois décennies de souvenirs collectifs et de sourires partagés par les familles, les professionnels et les personnes accompagnées au sein de notre association.
            </p>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showIntro ? 0 : 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 flex flex-col items-center gap-2 text-slate-400"
          >
            <span className="text-[10px] tracking-[0.3em] uppercase font-medium">Explorer</span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </motion.div>
        </section>

        {/* Statistiques animées */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="max-w-4xl mx-auto px-6 pb-16 relative z-10 text-center"
        >
          <div className="grid grid-cols-3 gap-4 md:gap-8 bg-white/60 backdrop-blur-md border border-blue-100 rounded-2xl p-6 md:p-8 shadow-sm">
            <div className="space-y-1">
              <p className="font-serif text-3xl md:text-5xl text-bleu font-bold">
                <AnimatedCounter from={0} to={stats.years_of_history} duration={1.8} delay={0.5} />
              </p>
              <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-sans font-semibold">Années d'histoire</p>
            </div>
            <div className="space-y-1 border-x border-blue-100/50">
              <p className="font-serif text-3xl md:text-5xl text-bleu font-bold">
                +<AnimatedCounter from={0} to={stats.total_memories} duration={2} delay={0.7} />
              </p>
              <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-sans font-semibold">Souvenirs partagés</p>
            </div>
            <div className="space-y-1">
              <p className="font-serif text-3xl md:text-5xl text-bleu font-bold">
                +<AnimatedCounter from={0} to={stats.total_comments} duration={2.2} delay={0.9} />
              </p>
              <p className="text-[10px] md:text-xs text-slate-400 uppercase tracking-widest font-sans font-semibold">Témoignages</p>
            </div>
          </div>
        </motion.section>

        {/* Deux grandes sections de navigation */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto px-6 pb-24 relative z-10"
        >
          {/* Card Timeline - Light Glass */}
          <TiltCard
            to="/timeline"
            className="group relative bg-white/70 backdrop-blur-md border border-blue-100 rounded-2xl p-10 min-h-[320px] flex flex-col justify-end hover:bg-white hover:border-bleu/30 transition-all duration-300"
          >
            <div className="absolute top-6 right-6 w-12 h-12 bg-bleu/5 rounded-full flex items-center justify-center border border-blue-50 group-hover:border-bleu/20 transition-colors">
              <svg className="w-5 h-5 text-bleu" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </div>
            
            <div className="space-y-3">
              <p className="text-bleu text-xs tracking-wider uppercase font-semibold">1994 → 2024</p>
              <h2 className="font-serif text-3xl text-encre group-hover:text-bleu transition-colors">Fresque Chronologique</h2>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Revivez l'histoire de l'association. Parcourez 30 ans d'événements, d'inaugurations et de victoires collectives classés par année.
              </p>
              <span className="inline-flex items-center gap-2 mt-4 text-bleu text-sm font-semibold group-hover:gap-4 transition-all duration-300">
                Explorer la timeline
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </TiltCard>

          {/* Card Galerie - Light Glass */}
          <TiltCard
            to="/galerie"
            className="group relative bg-white/70 backdrop-blur-md border border-blue-100 rounded-2xl p-10 min-h-[320px] flex flex-col justify-end hover:bg-white hover:border-bleu/30 transition-all duration-300"
          >
            <div className="absolute top-6 right-6 w-12 h-12 bg-bleu/5 rounded-full flex items-center justify-center border border-blue-50 group-hover:border-bleu/20 transition-colors">
              <svg className="w-5 h-5 text-bleu" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
            </div>

            <div className="space-y-3">
              <p className="text-bleu text-xs tracking-wider uppercase font-semibold font-sans">Mémoire intemporelle</p>
              <h2 className="font-serif text-3xl text-encre group-hover:text-bleu transition-colors">Galerie Infinie</h2>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Laissez-vous porter par les éclats de rire et les moments de partage capturés au quotidien. Une immersion visuelle sans repère de temps.
              </p>
              <span className="inline-flex items-center gap-2 mt-4 text-bleu text-sm font-semibold group-hover:gap-4 transition-all duration-300">
                Voir la galerie
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </div>
          </TiltCard>
        </motion.section>

        {/* Footer */}
        <footer className="text-center py-10 border-t border-blue-100/55 relative z-10">
          <div className="flex items-center justify-center gap-3 text-slate-400">
            <div className="h-px w-8 bg-jaune" />
            <span className="text-[10px] tracking-[0.25em] uppercase font-semibold text-bleu/80">Le Silence des Justes · 1994 – 2024</span>
            <div className="h-px w-8 bg-jaune" />
          </div>
        </footer>
      </div>
    </>
  );
}
