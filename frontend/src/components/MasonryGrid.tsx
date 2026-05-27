import { useRef } from "react";
import MediaCard from "./MediaCard";
import { useInfiniteScroll } from "../hooks/useInfiniteScroll";
import type { MediaItem } from "../lib/api";
import { motion } from "framer-motion";

interface MasonryGridProps {
  items: MediaItem[];
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  onMediaClick: (index: number) => void;
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

export default function MasonryGrid({
  items,
  onLoadMore,
  hasMore,
  isLoading,
  onMediaClick,
}: MasonryGridProps) {
  const sentinelRef = useInfiniteScroll(onLoadMore, hasMore && !isLoading);
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <motion.div
        ref={containerRef}
        variants={listVariants}
        initial="hidden"
        animate="show"
        style={{ columnCount: 3, columnGap: "1rem" }}
        className="w-full [column-count:1] sm:[column-count:2] lg:[column-count:3]"
      >
        {items.map((item, i) => (
          <MediaCard key={item.id} item={item} onClick={() => onMediaClick(i)} />
        ))}
      </motion.div>

      <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
        {isLoading && (
          <span className="text-bleu/40 text-sm animate-pulse">Chargement…</span>
        )}
        {!hasMore && items.length > 0 && (
          <div className="flex items-center gap-3 text-blue-200">
            <div className="h-px w-8 bg-jaune/30" />
            <span className="text-xs tracking-widest uppercase">fin de la galerie</span>
            <div className="h-px w-8 bg-jaune/30" />
          </div>
        )}
      </div>
    </>
  );
}
