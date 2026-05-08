"use client";

import { useEffect, useRef, useState } from "react";

/* ─────────────────────────── Scenario ─────────────────────────── */
// Hand-rehearsed sequence — values are illustrative, not a live simulation.
// Each tick is a snapshot of all five slots; "unborn" rows render as a
// collapsed placeholder, "retired" rows render dimmed.

type Status = "unborn" | "active" | "leading" | "retired" | "new";

type Slot = {
  label: string;
  s: number;
  f: number;
  alloc: number;
  status: Status;
  parent?: string;
};

type Tick = {
  round: number;
  message: string;
  slots: [Slot, Slot, Slot, Slot, Slot];
};

const unborn: Slot = {
  label: "",
  s: 0,
  f: 0,
  alloc: 0,
  status: "unborn",
};

const SCENARIO: Tick[] = [
  {
    round: 0,
    message: "Cold start. Three variants. Equal allocation.",
    slots: [
      { label: "V₁", s: 0, f: 0, alloc: 0.33, status: "active" },
      { label: "V₂", s: 0, f: 0, alloc: 0.33, status: "active" },
      { label: "V₃", s: 0, f: 0, alloc: 0.34, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 1,
    message: "First sends in. Posteriors begin to separate.",
    slots: [
      { label: "V₁", s: 8, f: 24, alloc: 0.31, status: "active" },
      { label: "V₂", s: 12, f: 18, alloc: 0.42, status: "active" },
      { label: "V₃", s: 4, f: 28, alloc: 0.27, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 2,
    message: "V₂ pulling ahead. Allocation tracks the posterior.",
    slots: [
      { label: "V₁", s: 15, f: 50, alloc: 0.25, status: "active" },
      { label: "V₂", s: 32, f: 38, alloc: 0.55, status: "leading" },
      { label: "V₃", s: 6, f: 60, alloc: 0.20, status: "active" },
      unborn,
      unborn,
    ],
  },
  {
    round: 3,
    message: "V₃'s posterior is collapsing. Retiring the laggard, spawning V₄ from V₂.",
    slots: [
      { label: "V₁", s: 22, f: 78, alloc: 0.18, status: "active" },
      { label: "V₂", s: 60, f: 60, alloc: 0.62, status: "leading" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 0, f: 0, alloc: 0.20, status: "new", parent: "V₂" },
      unborn,
    ],
  },
  {
    round: 4,
    message: "V₄ is exploring. Early returns outpace its parent.",
    slots: [
      { label: "V₁", s: 28, f: 102, alloc: 0.14, status: "active" },
      { label: "V₂", s: 88, f: 84, alloc: 0.40, status: "active" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 22, f: 24, alloc: 0.46, status: "leading", parent: "V₂" },
      unborn,
    ],
  },
  {
    round: 5,
    message: "V₄ confirmed best. V₁ retired. V₅ spawned. The loop continues.",
    slots: [
      { label: "V₁", s: 31, f: 124, alloc: 0, status: "retired" },
      { label: "V₂", s: 110, f: 110, alloc: 0.28, status: "active" },
      { label: "V₃", s: 7, f: 95, alloc: 0, status: "retired" },
      { label: "V₄", s: 50, f: 44, alloc: 0.55, status: "leading", parent: "V₂" },
      { label: "V₅", s: 0, f: 0, alloc: 0.17, status: "new", parent: "V₄" },
    ],
  },
];

const TICK_MS = 1800;
const TRANSITION_MS = 700;

/* ───────────────────────── Component ───────────────────────── */

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
      setTickIndex(SCENARIO.length - 1);
      return;
    }
    const id = window.setInterval(() => {
      setTickIndex((t) => (t + 1) % SCENARIO.length);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [inView, reducedMotion]);

  const tick = SCENARIO[tickIndex];

  return (
    <div
      ref={containerRef}
      className="border border-paper select-none"
      aria-label="Live allocation diagram"
      role="figure"
    >
      {/* Header */}
      <div className="border-b border-paper px-5 md:px-7 py-4 flex items-center justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70">
          Live allocator
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/70 tabular-nums">
          Round {String(tick.round).padStart(2, "0")} / {String(SCENARIO.length - 1).padStart(2, "0")}
        </span>
      </div>

      {/* Variant rows */}
      <div className="px-5 md:px-7 py-4 md:py-6">
        {tick.slots.map((slot, i) => (
          <Row key={i} slot={slot} />
        ))}
      </div>

      {/* Status bar */}
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

/* ─────────────────────────── Row ─────────────────────────── */

function Row({ slot }: { slot: Slot }) {
  const isUnborn = slot.status === "unborn";
  const isRetired = slot.status === "retired";
  const isLeading = slot.status === "leading";
  const isNew = slot.status === "new";

  const trials = slot.s + slot.f;
  const pct = Math.round(slot.alloc * 100);

  return (
    <div
      className="overflow-hidden transition-all ease-out"
      style={{
        maxHeight: isUnborn ? 0 : 80,
        opacity: isUnborn ? 0 : isRetired ? 0.32 : 1,
        transitionDuration: `${TRANSITION_MS}ms`,
      }}
      aria-hidden={isUnborn}
    >
      <div className="grid grid-cols-12 gap-3 md:gap-5 items-center py-3 md:py-3.5">
        {/* Label */}
        <div className="col-span-2 md:col-span-1 font-mono text-[14px] md:text-[15px] text-paper">
          {slot.label || "—"}
        </div>

        {/* Allocation bar */}
        <div className="col-span-7 md:col-span-7">
          <div className="relative h-2.5 md:h-3 border border-paper">
            <div
              className="absolute inset-y-0 left-0 bg-paper ease-out"
              style={{
                width: `${pct}%`,
                transitionProperty: "width",
                transitionDuration: `${TRANSITION_MS}ms`,
              }}
            />
          </div>
        </div>

        {/* Allocation % */}
        <div className="col-span-3 md:col-span-1 font-mono text-[13px] md:text-[14px] text-paper tabular-nums">
          {pct}%
        </div>

        {/* Trials + status pill */}
        <div className="col-span-12 md:col-span-3 flex items-center justify-between md:justify-end gap-3 md:gap-4 -mt-1 md:mt-0">
          <span className="font-mono text-[12px] md:text-[13px] text-paper/80 tabular-nums">
            {slot.s} / {trials}
          </span>
          <StatusPill
            isLeading={isLeading}
            isRetired={isRetired}
            isNew={isNew}
            parent={slot.parent}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  isLeading,
  isRetired,
  isNew,
  parent,
}: {
  isLeading: boolean;
  isRetired: boolean;
  isNew: boolean;
  parent?: string;
}) {
  if (isRetired) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60 border border-paper/40 px-2 py-0.5">
        retired
      </span>
    );
  }
  if (isNew) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper border border-paper px-2 py-0.5 whitespace-nowrap">
        ← spawned{parent ? ` from ${parent}` : ""}
      </span>
    );
  }
  if (isLeading) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink bg-paper px-2 py-0.5">
        leading
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50 border border-paper/30 px-2 py-0.5">
      active
    </span>
  );
}
