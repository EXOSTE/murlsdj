import { useEffect, useRef } from "react";
import gsap from "gsap";

interface IntroProps {
  onComplete: () => void;
}

export default function Intro({ onComplete }: IntroProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const counterWrapRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const title = titleRef.current;
    const overlay = overlayRef.current;
    if (!title || !overlay) return;

    const text = "Une infinité d'histoires";
    title.innerHTML = text
      .split("")
      .map((c) =>
        c === " "
          ? `<span style="display:inline-block;width:0.3em"></span>`
          : `<span style="display:inline-block;opacity:0">${c}</span>`
      )
      .join("");

    const chars = title.querySelectorAll<HTMLSpanElement>("span[style*='opacity']");

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(overlay, { opacity: 0, duration: 0.7, onComplete });
      },
    });

    tl.to(chars, { opacity: 1, duration: 0.04, stagger: 0.045, ease: "none" });
    tl.to(subtitleRef.current, { opacity: 1, y: 0, duration: 0.6 }, "-=0.1");
    tl.to(counterWrapRef.current, { opacity: 1, duration: 0.4 }, "-=0.2");
    tl.to(
      counterRef.current,
      { innerHTML: 30, duration: 1.4, ease: "power2.out", snap: { innerHTML: 1 } },
      "<"
    );
    tl.to({}, { duration: 1.6 });

    return () => { tl.kill(); };
  }, [onComplete]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 bg-encre flex flex-col items-center justify-center select-none"
    >
      {/* Liseré jaune en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-jaune" />

      <div ref={titleRef} className="font-serif text-3xl md:text-5xl text-white text-center px-8 leading-snug" />

      <p
        ref={subtitleRef}
        className="text-jaune text-xs tracking-widest uppercase mt-6"
        style={{ opacity: 0, transform: "translateY(8px)" }}
      >
        Le Silence des Justes · 1994 – 2024
      </p>

      <div
        ref={counterWrapRef}
        className="mt-12 flex items-end gap-3"
        style={{ opacity: 0 }}
      >
        <span ref={counterRef} className="font-serif text-8xl text-white/10 leading-none tabular-nums">
          0
        </span>
        <span className="text-white/10 text-2xl mb-2 font-serif">ans</span>
      </div>

      {/* Liseré jaune en bas */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-jaune" />
    </div>
  );
}
