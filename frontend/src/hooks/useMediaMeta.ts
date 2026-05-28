import type { MediaItem } from "../lib/api";

interface MediaMeta {
  title: string;
  description: string;
  ogImage: string | null;
  ogUrl: string;
  ogType: string;
  twitterCard: string;
}

export function useMediaMeta(item: MediaItem | null): MediaMeta | null {
  if (!item) return null;

  return {
    title: `${item.legende ?? "Souvenir"} — Mur LSDJ`,
    description: item.legende ?? "30 ans de souvenirs collectifs du Silence des Justes",
    ogImage: item.thumbnail_url ?? null,
    ogUrl: `${window.location.origin}/?media=${item.id}`,
    ogType: "article",
    twitterCard: "summary_large_image",
  };
}
