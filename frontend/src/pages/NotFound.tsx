import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-creme flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute w-[500px] h-[500px] bg-bleu/5 rounded-full filter blur-3xl -top-32 -left-32 pointer-events-none" />
      <div className="absolute w-[500px] h-[500px] bg-jaune/5 rounded-full filter blur-3xl -bottom-32 -right-32 pointer-events-none" />

      {/* Top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-bleu via-jaune to-bleu" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="space-y-6 max-w-md relative z-10"
      >
        {/* Decorative 404 number */}
        <div className="font-serif text-[120px] leading-none text-bleu/10 select-none font-bold">
          404
        </div>

        <div className="space-y-3 -mt-4">
          <p className="text-bleu text-xs tracking-[0.25em] uppercase font-semibold font-sans">
            Page introuvable
          </p>
          <h1 className="font-serif text-3xl text-encre leading-tight">
            Ce souvenir s'est perdu dans le temps
          </h1>
          <div className="flex items-center justify-center gap-3">
            <div className="h-0.5 w-6 bg-jaune" />
            <p className="text-slate-500 text-sm font-serif">
              La page que vous cherchez n'existe pas ou a été déplacée.
            </p>
            <div className="h-0.5 w-6 bg-jaune" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-bleu text-white px-6 py-3 rounded-xl font-medium text-sm hover:bg-encre transition-all duration-300 shadow-lg shadow-bleu/15"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m3 12 2.25-2.25m0 0L12 3.75l6.75 6L21 12m-18 0 2.25 2.25M5.25 9.75v10.5A.75.75 0 0 0 6 21h3.75a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75V20.25a.75.75 0 0 0 .75.75H18a.75.75 0 0 0 .75-.75V9.75" />
            </svg>
            Retour à l'accueil
          </Link>
          <Link
            to="/galerie"
            className="inline-flex items-center gap-2 border border-bleu/30 text-bleu px-6 py-3 rounded-xl font-medium text-sm hover:bg-bleu hover:text-white transition-all duration-300"
          >
            Voir la galerie
          </Link>
        </div>
      </motion.div>

      {/* Bottom footer text */}
      <p className="absolute bottom-6 text-[10px] tracking-[0.25em] uppercase font-semibold text-bleu/50">
        Le Silence des Justes · 1996 – 2026
      </p>
    </div>
  );
}
