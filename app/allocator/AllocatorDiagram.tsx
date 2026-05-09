"use client";

import { useEffect, useRef, useState } from "react";
import { ALLOCATOR_SCENARIO } from "@/app/_data/allocator-scenario";
import { Row, TRANSITION_MS } from "./parts";

const TICK_MS = 1800;

export function AllocatorDiagram() {
  const [tickIndex, setTickIndex] = useState(0);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Reduced-motion preference
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Pause when offscreen
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0]?.isIntersecting ?? false),
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Tick driver
  useEffect(() => {
    if (!inView) return;
    if (reducedMotion) {
      setTickIndex(ALLOCATOR_SCENARIO.length - 1);
      return;
    }
    const id = window.setInterval(() => {
      setTickIndex((t) => (t + 1) % ALLOCATOR_SCENARIO.length);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [inView, reducedMotion]);

  const tick = ALLOCATOR_SCENARIO[tickIndex];

  return (
    <div
      ref={containerRef}
      className="border border-paper select-none"
      aria-label="Live allocation diagram"
      role="figure"
    >
      <div className="border-b border-paper px-5 md:px-7 py-4 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70">
          Live allocator
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70 tabular-nums">
          Round {String(tick.round).padStart(2, "0")} /{" "}
          {String(ALLOCATOR_SCENARIO.length - 1).padStart(2, "0")}
        </span>
      </div>

      <div className="px-5 md:px-7 py-4 md:py-6">
        {tick.slots.map((slot, i) => (
          <Row key={i} slot={slot} />
        ))}
      </div>

      <div className="border-t border-paper px-5 md:px-7 py-4 flex flex-col md:flex-row md:items-baseline gap-2 md:gap-6">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">
          Status
        </span>
        <span
          key={tickIndex}
          className="font-mono text-[13px] md:text-[14px] text-paper/95"
          style={{ animation: `eigen-fade-in ${TRANSITION_MS}ms ease-out both` }}
        >
          {tick.message}
        </span>
      </div>

      {/* Inline keyframes — kept local to avoid polluting globals */}
      <style>{`
        @keyframes eigen-fade-in {
          0%   { opacity: 0; transform: translateY(2px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
