import { motion } from "framer-motion";
import type { MediaItem } from "../lib/api";

interface MediaCardProps {
  item: MediaItem;
  onClick: () => void;
}

export default function MediaCard({ item, onClick }: MediaCardProps) {
  const isText = item.file_url?.startsWith("text://");
  const authorName = isText ? item.file_url.replace("text://", "") : "";

  if (isText) {
    return (
      <motion.div
        layout
        variants={{
          hidden: { opacity: 0, y: 20 },
          show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
        }}
        className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-bleu to-encre p-7 break-inside-avoid mb-4 shadow-md hover:shadow-xl hover:shadow-bleu/15 hover:ring-2 hover:ring-jaune transition-all duration-300 min-h-[200px] flex flex-col justify-between text-white"
        onClick={onClick}
      >
        {/* Translucent decorative quotation mark in background */}
        <div className="absolute -top-4 -right-2 text-white/10 font-serif text-[160px] leading-none pointer-events-none select-none">
          ”
        </div>
        
        {/* Testimony text */}
        <div className="relative z-10">
          <p className="font-serif text-base md:text-lg leading-relaxed text-creme/95 group-hover:text-white transition-colors italic">
            « {item.legende} »
          </p>
        </div>

        {/* Author information & view link */}
        <div className="relative z-10 mt-6 flex items-end justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-[9px] text-jaune uppercase tracking-widest font-semibold font-sans mb-0.5">Témoignage</p>
            <p className="text-xs font-semibold font-sans text-white/90">{authorName || item.uploaded_by || "Anonyme"}</p>
          </div>
          <span className="text-[10px] text-jaune/80 group-hover:text-jaune font-semibold uppercase flex items-center gap-1 transition-colors">
            Voir
            <svg className="w-3 h-3 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
            </svg>
          </span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      variants={{
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
      }}
      className="cursor-pointer group relative overflow-hidden rounded-xl bg-blue-50 break-inside-avoid mb-4 shadow-sm hover:shadow-xl hover:shadow-jaune/5 hover:ring-1 hover:ring-jaune/30 transition-all duration-300"
      onClick={onClick}
    >
      <img
        src={item.thumbnail_url ?? item.file_url}
        alt={item.legende ?? ""}
        loading="lazy"
        className="w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
      />
      
      {/* Overlay dégradé sombre au survol pour améliorer la lisibilité */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {item.type === "video" && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="bg-bleu/80 backdrop-blur-sm rounded-full p-3.5 shadow-lg group-hover:bg-jaune group-hover:text-encre transition-all duration-300 group-hover:scale-110">
            <svg className="w-5 h-5 text-white group-hover:text-encre fill-current" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Légende en verre dépoli */}
      <div className="absolute bottom-0 left-0 right-0 backdrop-blur-md bg-encre/75 border-t border-white/10 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-10 flex flex-col gap-1.5">
        <p className="text-white text-xs leading-relaxed line-clamp-2 font-sans font-medium">
          {item.legende ?? <em className="text-slate-400 font-normal">Souvenir du Silence des Justes</em>}
        </p>
        <span className="text-[10px] text-jaune font-semibold tracking-wider uppercase flex items-center gap-1">
          Voir le souvenir
          <svg className="w-3 h-3 transition-transform group-hover:translate-x-1 duration-300" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </span>
      </div>
    </motion.div>
  );
}
