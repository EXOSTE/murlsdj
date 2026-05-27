import { useEffect, useRef, useCallback } from "react";

export function useInfiniteScroll(onLoadMore: () => void, hasMore: boolean) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const stableCallback = useCallback(onLoadMore, [onLoadMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) stableCallback();
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [stableCallback, hasMore]);

  return sentinelRef;
}
