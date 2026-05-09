"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { betaMean, betaPdf, sampleBeta } from "./beta";

/* ────────────────────────────────────────────────────────────────
   Types
   ──────────────────────────────────────────────────────────────── */

type Phase = "input" | "generating" | "running";

type Variant = {
  id: string;
  index: number;
  subject: string;
  body: string;
  axis: string;
  trueRate: number;
  alpha: number;
  beta: number;
  impressions: number;
  conversions: number;
  posteriorMeanHistory: { trial: number; mean: number }[];
  status: "active" | "dying" | "dead";
  isOriginal: boolean;
  bornAtTrial: number;
  color: string;
};

type AllocSnapshot = { trial: number; alloc: Record<string, number> };
type RatePoint = { trial: number; rate: number };

type SimState = {
  variants: Variant[];
  trial: number;
  generation: number;
  generationFlash: number | null;
  eigenImpressions: number;
  eigenConversions: number;
  uniformImpressions: number;
  uniformConversions: number;
  eigenHistory: RatePoint[];
  uniformHistory: RatePoint[];
  allocationHistory: AllocSnapshot[];
  recentChoices: string[];
  pendingReplacement: boolean;
  lastGenerationAtTrial: number;
  ended: boolean;
};

type ApiVariant = { subject: string; body: string; axis: string };

/* ────────────────────────────────────────────────────────────────
   Constants
   ──────────────────────────────────────────────────────────────── */

const STARTER_EMAIL = `Subject: We're closing the founding round at midnight

Hey there,

The founding round for Eigen closes at midnight tonight — 10 spots, $100 each, 50% off forever. After this, the next tier prices significantly higher and these spots are gone.

If you've been on the fence, this is the moment.

— Andrew`;

const ROLLING_WINDOW = 100;
const POSTERIOR_SNAPSHOT_INTERVAL = 20;
const REPLACEMENT_COUNT = 2;
const FADE_DURATION_MS = 1500;
const FLASH_DURATION_MS = 2000;

// Generation rule — blends a confidence-of-underperformance check with a
// time-bounded fallback so the loop always progresses without thrashing.
const GENERATION_CHECK_INTERVAL = 50;       // trials between rule evaluations
const MIN_GAP_BETWEEN_GEN = 200;            // cooldown after a generation
const MAX_GAP_BETWEEN_GEN = 600;            // hard ceiling — force a gen if reached
const MIN_IMPRESSIONS_FOR_RETIREMENT = 60;  // a variant must have this many sends to be retired
const TAIL_THRESHOLD = 0.05;                // Pr(variant is best) below this = "confident loser"
const PROB_BEST_SAMPLES = 500;              // Monte-Carlo samples used to estimate Pr(best)

// Hard stop on the demo: when a generation would mint variant #13 or beyond,
// we end the test instead and let the user reset.
const MAX_VARIANTS = 12;

// Default range the user can override on the input page. The demo samples 3
// variant true-rates uniformly from this range; the baseline is then their mean.
const DEFAULT_MIN_RATE_PCT = 4;
const DEFAULT_MAX_RATE_PCT = 30;

// Pulled from Monet's "Houses of Parliament" series — sunset, fog, stormy.
// Muted, painterly hues. Used only for variant identity; everything else
// stays black-and-white.
const PAINT_PALETTE = [
  "#C0573B", // sunset orange
  "#3F5870", // fog slate-blue
  "#8B5E80", // dusk plum
  "#6B8478", // misty teal
  "#A6794D", // ochre
  "#5E6A8C", // storm violet
  "#80926A", // sage olive
  "#B07F4F", // burnt umber
];

function colorFor(index: number): string {
  return PAINT_PALETTE[(index - 1) % PAINT_PALETTE.length];
}

/* ────────────────────────────────────────────────────────────────
   Random helpers (true-rate assignment is client-side)
   ──────────────────────────────────────────────────────────────── */

function randUniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

// Standalone variant true-rate sampler — used for the initial 3 variants.
// Baseline rate is then the *mean* of these, so the baseline can never beat
// the strongest variant by construction. Range is configurable by the user.
function sampleStandaloneVariantRate(min: number, max: number): number {
  const lo = Math.max(0, Math.min(min, max));
  const hi = Math.min(1, Math.max(min, max));
  return clamp(randUniform(lo, hi), 0, 1);
}

// Replacement variants are seeded around the surviving winner's true rate.
function sampleVariantRate(seed: number): number {
  return clamp(seed + randUniform(-0.10, 0.10), 0.02, 0.30);
}

/* ────────────────────────────────────────────────────────────────
   Email parsing — split first line as subject, remainder as body
   ──────────────────────────────────────────────────────────────── */

function parseInputEmail(raw: string): { subject: string; body: string } {
  const text = raw.trim();
  const firstNewline = text.indexOf("\n");
  if (firstNewline === -1) return { subject: text.slice(0, 120), body: "" };
  let subject = text.slice(0, firstNewline).trim();
  const body = text.slice(firstNewline + 1).trim();
  // Strip "Subject:" prefix if present
  subject = subject.replace(/^subject:\s*/i, "").trim();
  return { subject, body };
}

function variantToFullEmail(v: Variant): string {
  return `Subject: ${v.subject}\n\n${v.body}`;
}

/* ────────────────────────────────────────────────────────────────
   Simulation tick — pure function
   ──────────────────────────────────────────────────────────────── */

function tickOnce(s: SimState): SimState {
  const active = s.variants.filter((v) => v.status === "active");
  if (active.length === 0) return s;

  // Eigen: Thompson sampling
  let bestIdx = 0;
  let bestSample = -Infinity;
  for (let i = 0; i < active.length; i++) {
    const v = active[i];
    const sample = sampleBeta(v.alpha, v.beta);
    if (sample > bestSample) {
      bestSample = sample;
      bestIdx = i;
    }
  }
  const chosen = active[bestIdx];
  const success = Math.random() < chosen.trueRate;

  // Update variant posterior + counts
  const updatedVariants = s.variants.map((v) => {
    if (v.id !== chosen.id) return v;
    return {
      ...v,
      alpha: v.alpha + (success ? 1 : 0),
      beta: v.beta + (success ? 0 : 1),
      impressions: v.impressions + 1,
      conversions: v.conversions + (success ? 1 : 0),
    };
  });

  // Parallel uniform universe over the ORIGINAL 4
  const originals = s.variants.filter((v) => v.isOriginal);
  const uChosen = originals[Math.floor(Math.random() * originals.length)];
  const uSuccess = Math.random() < uChosen.trueRate;

  const newTrial = s.trial + 1;
  const newEigenImps = s.eigenImpressions + 1;
  const newEigenConv = s.eigenConversions + (success ? 1 : 0);
  const newUImps = s.uniformImpressions + 1;
  const newUConv = s.uniformConversions + (uSuccess ? 1 : 0);

  // Rolling window of choices for the allocation chart
  const recent = s.recentChoices.length >= ROLLING_WINDOW
    ? s.recentChoices.slice(1)
    : s.recentChoices.slice();
  recent.push(chosen.id);

  const eigenHistory = s.eigenHistory.concat({
    trial: newTrial,
    rate: newEigenConv / newEigenImps,
  });
  const uniformHistory = s.uniformHistory.concat({
    trial: newTrial,
    rate: newUConv / newUImps,
  });

  let allocationHistory = s.allocationHistory;
  if (newTrial % 5 === 0) {
    const counts: Record<string, number> = {};
    for (const id of recent) counts[id] = (counts[id] ?? 0) + 1;
    const alloc: Record<string, number> = {};
    for (const id in counts) alloc[id] = counts[id] / recent.length;
    allocationHistory = allocationHistory.concat({ trial: newTrial, alloc });
  }

  let nextVariants = updatedVariants;
  if (newTrial % POSTERIOR_SNAPSHOT_INTERVAL === 0) {
    nextVariants = updatedVariants.map((v) => {
      if (v.status !== "active") return v;
      return {
        ...v,
        posteriorMeanHistory: v.posteriorMeanHistory.concat({
          trial: newTrial,
          mean: betaMean(v.alpha, v.beta),
        }),
      };
    });
  }

  return {
    ...s,
    variants: nextVariants,
    trial: newTrial,
    eigenImpressions: newEigenImps,
    eigenConversions: newEigenConv,
    uniformImpressions: newUImps,
    uniformConversions: newUConv,
    eigenHistory,
    uniformHistory,
    allocationHistory,
    recentChoices: recent,
  };
}

/* ────────────────────────────────────────────────────────────────
   Generation rule — confidence × time
   ──────────────────────────────────────────────────────────────── */

// Monte-Carlo estimate of Pr(variant is the best) by sampling each posterior.
function probabilityBest(active: Variant[]): Map<string, number> {
  const wins = new Map<string, number>();
  for (const v of active) wins.set(v.id, 0);
  for (let s = 0; s < PROB_BEST_SAMPLES; s++) {
    let bestId = active[0].id;
    let bestVal = -Infinity;
    for (const v of active) {
      const x = sampleBeta(v.alpha, v.beta);
      if (x > bestVal) {
        bestVal = x;
        bestId = v.id;
      }
    }
    wins.set(bestId, (wins.get(bestId) ?? 0) + 1);
  }
  const out = new Map<string, number>();
  for (const v of active) {
    out.set(v.id, (wins.get(v.id) ?? 0) / PROB_BEST_SAMPLES);
  }
  return out;
}

// Returns the ids of variants to retire — empty if no generation should fire.
function selectVictims(sim: SimState): string[] {
  const active = sim.variants.filter((v) => v.status === "active");
  if (active.length < 4) return [];

  const sinceLast = sim.trial - sim.lastGenerationAtTrial;
  if (sinceLast < MIN_GAP_BETWEEN_GEN) return [];

  // Force after the max gap — bottom 2 by posterior mean, regardless of confidence.
  if (sinceLast >= MAX_GAP_BETWEEN_GEN) {
    return active
      .slice()
      .sort((a, b) => betaMean(a.alpha, a.beta) - betaMean(b.alpha, b.beta))
      .slice(0, REPLACEMENT_COUNT)
      .map((v) => v.id);
  }

  // Confidence path: variants with enough data AND Pr(best) under the tail threshold.
  const probs = probabilityBest(active);
  const losers = active
    .filter(
      (v) =>
        v.impressions >= MIN_IMPRESSIONS_FOR_RETIREMENT &&
        (probs.get(v.id) ?? 1) < TAIL_THRESHOLD,
    )
    .sort((a, b) => (probs.get(a.id) ?? 1) - (probs.get(b.id) ?? 1));
  if (losers.length >= REPLACEMENT_COUNT) {
    return losers.slice(0, REPLACEMENT_COUNT).map((v) => v.id);
  }
  return [];
}

/* ────────────────────────────────────────────────────────────────
   Page component
   ──────────────────────────────────────────────────────────────── */

export default function DemoPage() {
  const [phase, setPhase] = useState<Phase>("input");
  const [inputEmail, setInputEmail] = useState<string>(STARTER_EMAIL);
  const [minRatePct, setMinRatePct] = useState<number>(DEFAULT_MIN_RATE_PCT);
  const [maxRatePct, setMaxRatePct] = useState<number>(DEFAULT_MAX_RATE_PCT);
  const [sim, setSim] = useState<SimState | null>(null);
  const [speed, setSpeed] = useState<number>(10);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showTrueRates, setShowTrueRates] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const simRef = useRef<SimState | null>(null);
  const replacementInFlightRef = useRef<boolean>(false);
  useEffect(() => {
    simRef.current = sim;
  }, [sim]);

  /* ── Variant generation (initial) ─────────────────────────────── */

  const handleStart = useCallback(async () => {
    if (!inputEmail.trim()) return;
    setErrorMsg(null);
    setPhase("generating");

    let apiVariants: ApiVariant[] = [];
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "generate_variants", baseline: inputEmail }),
      });
      const data = await res.json();
      apiVariants = Array.isArray(data?.variants) ? data.variants : [];
      if (apiVariants.length < 3) throw new Error("Insufficient variants");
    } catch (err) {
      console.error(err);
      setErrorMsg("Variant generation failed. Using fallback variants.");
      apiVariants = [
        { subject: "Founding round closes tonight", body: "10 spots, $100, 50% off forever. After tonight the price moves.", axis: "stronger urgency" },
        { subject: "A heads up before midnight", body: "If you've been waiting on Eigen — tonight is the deadline. Founding spots disappear at 12.", axis: "softer tone" },
        { subject: "Want 50% off forever?", body: "Founding members lock in 50% off whatever pricing ends up being — for life. 10 spots only. Closes tonight.", axis: "different cta framing" },
      ];
    }

    const baselineParsed = parseInputEmail(inputEmail);
    // Sample 3 variant true-rates first; baseline is then their mean,
    // which guarantees at least one variant beats baseline.
    const minRate = minRatePct / 100;
    const maxRate = maxRatePct / 100;
    const variantTrueRates = apiVariants
      .slice(0, 3)
      .map(() => sampleStandaloneVariantRate(minRate, maxRate));
    const baselineRate =
      variantTrueRates.reduce((a, b) => a + b, 0) / variantTrueRates.length;
    const variants: Variant[] = [
      {
        id: "v_0",
        index: 1,
        subject: baselineParsed.subject || "(no subject)",
        body: baselineParsed.body,
        axis: "baseline",
        trueRate: baselineRate,
        alpha: 1,
        beta: 1,
        impressions: 0,
        conversions: 0,
        posteriorMeanHistory: [],
        status: "active",
        isOriginal: true,
        bornAtTrial: 0,
        color: colorFor(1),
      },
      ...apiVariants.slice(0, 3).map((av, i) => ({
        id: `v_${i + 1}`,
        index: i + 2,
        subject: av.subject,
        body: av.body,
        axis: av.axis,
        trueRate: variantTrueRates[i],
        alpha: 1,
        beta: 1,
        impressions: 0,
        conversions: 0,
        posteriorMeanHistory: [],
        status: "active" as const,
        isOriginal: true,
        bornAtTrial: 0,
        color: colorFor(i + 2),
      })),
    ];

    setSim({
      variants,
      trial: 0,
      generation: 1,
      generationFlash: null,
      lastGenerationAtTrial: 0,
      ended: false,
      eigenImpressions: 0,
      eigenConversions: 0,
      uniformImpressions: 0,
      uniformConversions: 0,
      eigenHistory: [],
      uniformHistory: [],
      allocationHistory: [],
      recentChoices: [],
      pendingReplacement: false,
    });
    setIsPaused(false);
    setPhase("running");
  }, [inputEmail, minRatePct, maxRatePct]);

  /* ── Reset ───────────────────────────────────────────────────── */

  const handleReset = useCallback(() => {
    replacementInFlightRef.current = false;
    setSim(null);
    setIsPaused(false);
    setShowTrueRates(false);
    setErrorMsg(null);
    setPhase("input");
  }, []);

  /* ── Simulation tick driver ──────────────────────────────────── */

  useEffect(() => {
    if (phase !== "running" || !sim) return;
    if (isPaused || sim.pendingReplacement || sim.ended) return;
    const ms = Math.max(20, Math.round(1000 / speed));
    const id = window.setInterval(() => {
      setSim((prev) => (prev ? tickOnce(prev) : prev));
    }, ms);
    return () => window.clearInterval(id);
  }, [phase, sim, isPaused, speed]);

  /* ── Stabilization → kill bottom 2 → call API → spawn replacements ── */

  const runReplacement = useCallback(async (victimIds: string[]) => {
    if (replacementInFlightRef.current) return;
    if (victimIds.length === 0) return;
    const current = simRef.current;
    if (!current) return;
    const active = current.variants.filter((v) => v.status === "active");
    if (active.length < 4) return;

    replacementInFlightRef.current = true;

    const dyingIds = new Set(victimIds);
    // Winner = best active variant NOT being retired (posterior-mean ranking).
    const survivors = active
      .filter((v) => !dyingIds.has(v.id))
      .sort(
        (a, b) => betaMean(b.alpha, b.beta) - betaMean(a.alpha, a.beta),
      );
    const winner = survivors[0] ?? active[0];

    setSim((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        pendingReplacement: true,
        variants: prev.variants.map((v) =>
          dyingIds.has(v.id) ? { ...v, status: "dying" } : v,
        ),
      };
    });

    // Fade animation period
    await new Promise((r) => setTimeout(r, FADE_DURATION_MS));

    // Mark dying as dead
    setSim((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        variants: prev.variants.map((v) =>
          v.status === "dying" ? { ...v, status: "dead" } : v,
        ),
      };
    });

    // Call API for replacements
    let apiVariants: ApiVariant[] = [];
    try {
      const res = await fetch("/api/demo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "generate_replacement_variants",
          winner: variantToFullEmail(winner),
          count: REPLACEMENT_COUNT,
        }),
      });
      const data = await res.json();
      apiVariants = Array.isArray(data?.variants) ? data.variants : [];
      if (apiVariants.length < REPLACEMENT_COUNT) {
        throw new Error("Insufficient replacements");
      }
    } catch (err) {
      console.error(err);
      apiVariants = [
        { subject: "Last chance — closes at midnight", body: "Founding round ends tonight. After this, prices move and these spots are gone.", axis: "harder deadline" },
        { subject: "Locked-in pricing for early backers", body: "Founding members keep 50% off forever — even after we raise. Spots are limited.", axis: "value-first framing" },
      ];
    }

    setSim((prev) => {
      if (!prev) return prev;
      const maxIndex = prev.variants.reduce((m, v) => Math.max(m, v.index), 0);
      const winnerRate = winner.trueRate;
      const newVariants: Variant[] = apiVariants
        .slice(0, REPLACEMENT_COUNT)
        .map((av, i) => ({
          id: `v_${prev.generation + 1}_${i}_${Math.random().toString(36).slice(2, 6)}`,
          index: maxIndex + 1 + i,
          subject: av.subject,
          body: av.body,
          axis: av.axis,
          trueRate: sampleVariantRate(winnerRate),
          alpha: 1,
          beta: 1,
          impressions: 0,
          conversions: 0,
          posteriorMeanHistory: [],
          status: "active" as const,
          isOriginal: false,
          bornAtTrial: prev.trial,
          color: colorFor(maxIndex + 1 + i),
        }));
      const nextGeneration = prev.generation + 1;
      return {
        ...prev,
        variants: prev.variants.concat(newVariants),
        generation: nextGeneration,
        generationFlash: nextGeneration,
        lastGenerationAtTrial: prev.trial,
        pendingReplacement: false,
      };
    });

    replacementInFlightRef.current = false;

    // Clear flash after duration
    setTimeout(() => {
      setSim((prev) => (prev ? { ...prev, generationFlash: null } : prev));
    }, FLASH_DURATION_MS);
  }, []);

  /* ── Generation watcher ──────────────────────────────────────── */

  useEffect(() => {
    if (!sim) return;
    if (sim.ended) return;
    if (sim.pendingReplacement) return;
    if (replacementInFlightRef.current) return;
    if (sim.trial < GENERATION_CHECK_INTERVAL) return;
    if (sim.trial % GENERATION_CHECK_INTERVAL !== 0) return;

    const victims = selectVictims(sim);
    if (victims.length === 0) return;

    // The generation rule wants to retire variants — but if doing so would
    // mint variant #13+, we instead end the demo and let the user reset.
    if (sim.variants.length + REPLACEMENT_COUNT > MAX_VARIANTS) {
      setSim((prev) => (prev ? { ...prev, ended: true } : prev));
      setIsPaused(true);
      return;
    }

    void runReplacement(victims);
  }, [sim, runReplacement]);

  /* ── Render ──────────────────────────────────────────────────── */

  return (
    <main className="min-h-screen bg-paper text-ink">
      <Nav />

      {phase === "input" && (
        <InputPhase
          inputEmail={inputEmail}
          setInputEmail={setInputEmail}
          minRatePct={minRatePct}
          setMinRatePct={setMinRatePct}
          maxRatePct={maxRatePct}
          setMaxRatePct={setMaxRatePct}
          onStart={handleStart}
          errorMsg={errorMsg}
        />
      )}

      {phase === "generating" && <GeneratingPhase />}

      {phase === "running" && sim && (
        <SimulationPhase
          sim={sim}
          speed={speed}
          setSpeed={setSpeed}
          isPaused={isPaused}
          setIsPaused={setIsPaused}
          showTrueRates={showTrueRates}
          setShowTrueRates={setShowTrueRates}
          onReset={handleReset}
          errorMsg={errorMsg}
        />
      )}
    </main>
  );
}

/* ────────────────────────────────────────────────────────────────
   Nav
   ──────────────────────────────────────────────────────────────── */

function Nav() {
  return (
    <header className="border-b border-ink">
      <div className="px-6 md:px-10 py-5 flex items-center justify-between">
        <Link href="/" className="flex items-baseline gap-3">
          <span className="font-serif text-3xl leading-none">λ</span>
          <span className="font-serif text-2xl leading-none tracking-tight">
            Eigen
          </span>
        </Link>
        <Link
          href="/"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 hover:text-ink transition-colors"
        >
          ← back
        </Link>
      </div>
    </header>
  );
}

/* ────────────────────────────────────────────────────────────────
   Phase 1 — input
   ──────────────────────────────────────────────────────────────── */

function InputPhase({
  inputEmail,
  setInputEmail,
  minRatePct,
  setMinRatePct,
  maxRatePct,
  setMaxRatePct,
  onStart,
  errorMsg,
}: {
  inputEmail: string;
  setInputEmail: (s: string) => void;
  minRatePct: number;
  setMinRatePct: (n: number) => void;
  maxRatePct: number;
  setMaxRatePct: (n: number) => void;
  onStart: () => void;
  errorMsg: string | null;
}) {
  const rangeValid = minRatePct < maxRatePct;
  return (
    <section className="px-6 md:px-10 py-16 md:py-24">
      <div className="max-w-[800px] mx-auto">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-8">
          Live demo
        </p>
        <h1 className="font-display text-[44px] md:text-[72px] leading-[0.98] tracking-tight">
          Watch Eigen optimize a real email.
        </h1>
        <p className="mt-8 text-[17px] leading-relaxed text-ink/80 max-w-[58ch]">
          Paste a marketing email below. Eigen will generate three variants
          along different axes, assign each a hidden conversion rate, and run
          Thompson sampling against all four — live, in your browser. Watch
          allocation track the posteriors, losers retire, and new variants
          spawn from the leader.
        </p>

        <div className="mt-12">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-3 block">
            Your email
          </label>
          <textarea
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            rows={12}
            className="w-full border border-ink bg-paper p-5 font-mono text-[13px] leading-relaxed text-ink resize-y focus:outline-none placeholder:text-ink/40"
            placeholder="Paste your email here. Subject line on the first line, body below."
            spellCheck={false}
          />
        </div>

        <div className="mt-10">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-3 block">
            Conversion rate range
          </label>
          <p className="text-[13px] text-ink/70 leading-relaxed max-w-[58ch] mb-4">
            Each variant&rsquo;s hidden true conversion rate is sampled
            uniformly from this range. The baseline is set to the mean of
            the three sampled rates, so at least one variant always beats
            the baseline.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[12px] text-ink/80">
            <label className="inline-flex items-center gap-2">
              <span className="uppercase tracking-[0.14em] text-ink/60">min</span>
              <input
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={minRatePct}
                onChange={(e) =>
                  setMinRatePct(parseFloat(e.target.value || "0"))
                }
                className="w-20 border border-ink bg-paper px-2 py-1 font-mono text-[13px] tabular-nums focus:outline-none"
              />
              <span className="text-ink/60">%</span>
            </label>
            <span className="text-ink/40">to</span>
            <label className="inline-flex items-center gap-2">
              <span className="uppercase tracking-[0.14em] text-ink/60">max</span>
              <input
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={maxRatePct}
                onChange={(e) =>
                  setMaxRatePct(parseFloat(e.target.value || "0"))
                }
                className="w-20 border border-ink bg-paper px-2 py-1 font-mono text-[13px] tabular-nums focus:outline-none"
              />
              <span className="text-ink/60">%</span>
            </label>
            {!rangeValid && (
              <span className="text-ink/60">min must be below max</span>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-3">
          <button
            onClick={onStart}
            disabled={!inputEmail.trim() || !rangeValid}
            className="bg-ink text-paper px-7 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Run Eigen on this →
          </button>
          {errorMsg && (
            <span className="font-mono text-[11px] text-ink/60">{errorMsg}</span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────
   Phase 2 — generating
   ──────────────────────────────────────────────────────────────── */

function GeneratingPhase() {
  return (
    <section className="px-6 md:px-10 min-h-[60vh] flex flex-col items-center justify-center">
      <h2 className="font-display text-[40px] md:text-[56px] leading-[1] tracking-tight">
        Generating variants
      </h2>
      <DotPulse className="mt-8" />
    </section>
  );
}

function DotPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="dot-pulse-1 font-mono text-[28px] leading-none">.</span>
      <span className="dot-pulse-2 font-mono text-[28px] leading-none">.</span>
      <span className="dot-pulse-3 font-mono text-[28px] leading-none">.</span>
      <style>{`
        @keyframes dotpulse {
          0%, 60%, 100% { opacity: 0.2; }
          30%           { opacity: 1; }
        }
        .dot-pulse-1 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0s; }
        .dot-pulse-2 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0.2s; }
        .dot-pulse-3 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Phase 3 — simulation
   ──────────────────────────────────────────────────────────────── */

function SimulationPhase({
  sim,
  speed,
  setSpeed,
  isPaused,
  setIsPaused,
  showTrueRates,
  setShowTrueRates,
  onReset,
  errorMsg,
}: {
  sim: SimState;
  speed: number;
  setSpeed: (n: number) => void;
  isPaused: boolean;
  setIsPaused: (b: boolean) => void;
  showTrueRates: boolean;
  setShowTrueRates: (b: boolean) => void;
  onReset: () => void;
  errorMsg: string | null;
}) {
  // Per the brief: dead variants stay visible (faded), they aren't removed.
  const orderedVariants = sim.variants.slice().sort((a, b) => a.index - b.index);

  const eigenRate =
    sim.eigenImpressions > 0 ? sim.eigenConversions / sim.eigenImpressions : 0;
  const uniformRate =
    sim.uniformImpressions > 0
      ? sim.uniformConversions / sim.uniformImpressions
      : 0;
  // Arithmetic difference in percentage points (Eigen − Uniform).
  const advantagePp = (eigenRate - uniformRate) * 100;

  return (
    <section className="relative px-6 md:px-10 py-10 md:py-12">
      {/* Generation flash */}
      {sim.generationFlash !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 border border-ink bg-paper px-4 py-2 font-mono text-[12px] uppercase tracking-[0.18em] gen-flash">
          Generation {sim.generationFlash}
        </div>
      )}

      {/* Pending replacement banner — only during the API call, not the fade */}
      {sim.pendingReplacement &&
        !sim.variants.some((v) => v.status === "dying") && (
          <div className="border border-ink bg-paper px-4 py-3 mb-6 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
              Generating new variants
            </span>
            <DotPulse />
          </div>
        )}

      {/* Test-complete banner — fires when the next generation would mint variant #13 */}
      {sim.ended && (
        <div className="border border-ink bg-ink text-paper px-5 py-4 mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/70">
              Test complete
            </span>
            <span className="font-serif text-[22px] leading-tight mt-1">
              {MAX_VARIANTS} variants explored. The loop has paused.
            </span>
          </div>
          <button
            onClick={onReset}
            className="border border-paper px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-paper hover:text-ink transition-colors"
          >
            reset
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="font-mono text-[11px] text-ink/60 mb-4">{errorMsg}</div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-8 font-mono text-[11px] uppercase tracking-[0.14em]">
        <button
          onClick={() => setShowTrueRates(!showTrueRates)}
          className="flex items-center gap-2"
        >
          <span
            className={`inline-block w-3 h-3 border border-ink ${
              showTrueRates ? "bg-ink" : "bg-paper"
            }`}
          />
          show true rates
        </button>

        <div className="flex items-center gap-3">
          <span className="text-ink/70">
            speed: {speed} trials/sec
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            className="accent-black w-32"
          />
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
        >
          {isPaused ? "resume" : "pause"}
        </button>

        <button
          onClick={onReset}
          className="border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
        >
          reset
        </button>

        <span className="text-ink/60 ml-auto">
          generation {sim.generation} · trial {sim.trial}
        </span>
      </div>

      {/* Variants strip — single horizontal row, scrolls if many */}
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Variants
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-6 px-6 md:-mx-10 md:px-10 items-stretch">
        {orderedVariants.map((v) => (
          <VariantCard key={v.id} variant={v} />
        ))}
      </div>

      {/* Totals table */}
      <div className="mt-10 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Totals
      </div>
      <TotalsTable
        eigenImpressions={sim.eigenImpressions}
        eigenConversions={sim.eigenConversions}
        eigenRate={eigenRate}
        uniformImpressions={sim.uniformImpressions}
        uniformConversions={sim.uniformConversions}
        uniformRate={uniformRate}
        advantagePp={advantagePp}
      />

      {/* Per-variant stats table */}
      <div className="mt-8 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Per-variant metrics
      </div>
      <StatsTable variants={orderedVariants} showTrueRate={showTrueRates} />

      {/* 2 × 2 chart grid */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Conversion rate per variant">
          <ConversionRatesChart sim={sim} variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>

        <ChartCard title="Allocation over time">
          <AllocationChart sim={sim} variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>

        <ChartCard title="Aggregate conversion rate" prominent>
          <ComparisonChart sim={sim} />
          <EigenUniformLegend />
          <div className="mt-3 font-mono text-[12px] text-ink/80">
            Eigen converted{" "}
            <span className="text-ink">
              {advantagePp >= 0 ? "+" : "−"}
              {Math.abs(advantagePp).toFixed(2)} pp
            </span>{" "}
            {advantagePp >= 0 ? "higher" : "lower"} than uniform allocation
            over the same impressions.
          </div>
        </ChartCard>

        <ChartCard title="Posterior conversion rate distributions">
          <PosteriorDistributionsChart variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>
      </div>

      <style>{`
        @keyframes gen-flash-anim {
          0%   { opacity: 0; transform: translate(-50%, -8px); }
          15%  { opacity: 1; transform: translate(-50%, 0); }
          85%  { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -8px); }
        }
        .gen-flash {
          animation: gen-flash-anim ${FLASH_DURATION_MS}ms ease-out forwards;
        }
        @keyframes variant-slide-in {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

function TotalsTable({
  eigenImpressions,
  eigenConversions,
  eigenRate,
  uniformImpressions,
  uniformConversions,
  uniformRate,
  advantagePp,
}: {
  eigenImpressions: number;
  eigenConversions: number;
  eigenRate: number;
  uniformImpressions: number;
  uniformConversions: number;
  uniformRate: number;
  advantagePp: number;
}) {
  const sign = advantagePp >= 0 ? "+" : "−";
  return (
    <div className="border border-ink overflow-x-auto">
      <table className="w-full text-[14px] tabular-nums">
        <thead>
          <tr className="border-b border-ink font-mono text-[10px] uppercase tracking-[0.16em] text-ink/70">
            <th className="text-left py-2 px-3 font-normal">Metric</th>
            <th className="text-right py-2 px-3 font-normal">Eigen</th>
            <th className="text-right py-2 px-3 font-normal">Uniform</th>
            <th className="text-right py-2 px-3 font-normal">
              Δ (Eigen − Uniform)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-ink/15">
            <td className="py-2 px-3 font-mono text-[12px]">Impressions</td>
            <td className="py-2 px-3 text-right">
              {eigenImpressions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {uniformImpressions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right text-ink/50">—</td>
          </tr>
          <tr className="border-b border-ink/15">
            <td className="py-2 px-3 font-mono text-[12px]">Conversions</td>
            <td className="py-2 px-3 text-right">
              {eigenConversions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {uniformConversions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {eigenConversions - uniformConversions >= 0 ? "+" : "−"}
              {Math.abs(eigenConversions - uniformConversions).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="py-2 px-3 font-mono text-[12px]">Conv. rate</td>
            <td className="py-2 px-3 text-right">
              {(eigenRate * 100).toFixed(2)}%
            </td>
            <td className="py-2 px-3 text-right">
              {(uniformRate * 100).toFixed(2)}%
            </td>
            <td className="py-2 px-3 text-right">
              {sign}
              {Math.abs(advantagePp).toFixed(2)} pp
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function VariantLegend({ variants }: { variants: Variant[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-ink/15 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/70">
      {variants.map((v) => {
        const faded = v.status !== "active";
        return (
          <span
            key={v.id}
            className="inline-flex items-center gap-1.5"
            style={{ opacity: faded ? 0.4 : 1 }}
          >
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ backgroundColor: v.color }}
              aria-hidden
            />
            <span style={{ textDecoration: faded ? "line-through" : "none" }}>
              V{String(v.index).padStart(2, "0")}
            </span>
          </span>
        );
      })}
    </div>
  );
}

function EigenUniformLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-ink/15 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/70">
      <span className="inline-flex items-center gap-2">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="#000" strokeWidth="2" />
        </svg>
        Eigen
      </span>
      <span className="inline-flex items-center gap-2">
        <svg width="22" height="6" aria-hidden>
          <line
            x1="0"
            y1="3"
            x2="22"
            y2="3"
            stroke="#000"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        </svg>
        Uniform
      </span>
    </div>
  );
}

function ChartCard({
  title,
  children,
  prominent = false,
}: {
  title: string;
  children: React.ReactNode;
  prominent?: boolean;
}) {
  return (
    <div className={`border border-ink p-4 ${prominent ? "bg-paper" : "bg-paper"}`}>
      <div className="flex items-baseline justify-between mb-3">
        <span className="font-serif text-[20px] leading-none">{title}</span>
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Variant card
   ──────────────────────────────────────────────────────────────── */

function VariantCard({ variant }: { variant: Variant }) {
  const isDying = variant.status === "dying";
  const isDead = variant.status === "dead";
  const faded = isDying || isDead;

  return (
    <article
      className="shrink-0 w-[380px] border border-ink p-6 bg-paper flex flex-col"
      style={{
        opacity: faded ? 0.3 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms linear`,
        animation:
          variant.bornAtTrial > 0 && !faded
            ? "variant-slide-in 600ms ease-out both"
            : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 shrink-0"
            style={{ backgroundColor: variant.color }}
            aria-hidden
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink"
            style={{ textDecoration: faded ? "line-through" : "none" }}
          >
            VARIANT_{String(variant.index).padStart(2, "0")}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60 truncate ml-2">
          {variant.axis}
        </span>
      </div>

      <div className="font-serif text-[22px] leading-tight mb-3">
        {variant.subject || "(no subject)"}
      </div>
      <div className="text-[14px] text-ink/80 leading-relaxed whitespace-pre-line">
        {variant.body.trim() || "(empty body)"}
      </div>
    </article>
  );
}

/* ────────────────────────────────────────────────────────────────
   Stats table — per-variant metrics
   ──────────────────────────────────────────────────────────────── */

function StatsTable({
  variants,
  showTrueRate,
}: {
  variants: Variant[];
  showTrueRate: boolean;
}) {
  return (
    <div className="border border-ink overflow-x-auto">
      <table className="w-full text-[13px] tabular-nums">
        <thead>
          <tr className="border-b border-ink font-mono text-[10px] uppercase tracking-[0.16em] text-ink/70">
            <th className="text-left py-2 px-3 font-normal">Variant</th>
            <th className="text-left py-2 px-3 font-normal">Axis</th>
            <th className="text-right py-2 px-3 font-normal">Impressions</th>
            <th className="text-right py-2 px-3 font-normal">Conversions</th>
            <th className="text-right py-2 px-3 font-normal">Conv. rate</th>
            {showTrueRate && (
              <th className="text-right py-2 px-3 font-normal">True rate</th>
            )}
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => {
            const rate = betaMean(v.alpha, v.beta);
            const faded = v.status !== "active";
            return (
              <tr
                key={v.id}
                className={`${
                  i < variants.length - 1 ? "border-b border-ink/15" : ""
                }`}
                style={{
                  opacity: faded ? 0.45 : 1,
                  transition: `opacity ${FADE_DURATION_MS}ms linear`,
                }}
              >
                <td className="py-2 px-3 font-mono text-[12px]">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 shrink-0"
                      style={{ backgroundColor: v.color }}
                      aria-hidden
                    />
                    <span
                      style={{
                        textDecoration: faded ? "line-through" : "none",
                      }}
                    >
                      V{String(v.index).padStart(2, "0")}
                    </span>
                  </span>
                </td>
                <td className="py-2 px-3 text-ink/70 truncate max-w-[260px]">
                  {v.axis}
                </td>
                <td className="py-2 px-3 text-right">{v.impressions}</td>
                <td className="py-2 px-3 text-right">{v.conversions}</td>
                <td className="py-2 px-3 text-right">
                  {(rate * 100).toFixed(1)}%
                </td>
                {showTrueRate && (
                  <td
                    className="py-2 px-3 text-right font-mono"
                    style={{ color: v.color }}
                  >
                    {(v.trueRate * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   Chart — conversion rate per variant over time
   ──────────────────────────────────────────────────────────────── */

function ConversionRatesChart({
  sim,
  variants,
}: {
  sim: SimState;
  variants: Variant[];
}) {
  const W = 520;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const trial = Math.max(sim.trial, 1);

  let yMax = 0.05;
  for (const v of variants) {
    for (const p of v.posteriorMeanHistory) {
      if (p.mean > yMax) yMax = p.mean;
    }
  }
  yMax = Math.min(1, yMax * 1.2);

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (y: number) => PAD_T + plotH - (y / yMax) * plotH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={PAD_T + plotH}
        y2={PAD_T + plotH}
        stroke="#000"
        strokeWidth={1}
      />
      <line
        x1={PAD_L}
        x2={PAD_L}
        y1={PAD_T}
        y2={PAD_T + plotH}
        stroke="#000"
        strokeWidth={1}
      />

      <text
        x={PAD_L}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="start"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0
      </text>
      <text
        x={W - PAD_R}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {sim.trial}
      </text>

      <text
        x={PAD_L - 4}
        y={PAD_T + 4}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {(yMax * 100).toFixed(0)}%
      </text>
      <text
        x={PAD_L - 4}
        y={PAD_T + plotH}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0%
      </text>

      {variants.map((v) => {
        if (v.posteriorMeanHistory.length < 2) return null;
        const opacity = v.status === "active" ? 1 : 0.3;
        const d = v.posteriorMeanHistory
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xPx(p.trial).toFixed(1)} ${yPx(p.mean).toFixed(1)}`,
          )
          .join(" ");
        return (
          <path
            key={v.id}
            d={d}
            fill="none"
            stroke={v.color}
            strokeWidth={1.5}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Chart — allocation stacked area, color-coded
   ──────────────────────────────────────────────────────────────── */

function AllocationChart({
  sim,
  variants,
}: {
  sim: SimState;
  variants: Variant[];
}) {
  const W = 520;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const trial = Math.max(sim.trial, 1);
  const history = sim.allocationHistory;

  if (history.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto">
        <rect
          x={PAD_L}
          y={PAD_T}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="#000"
          strokeWidth={1}
        />
        <text
          x={W / 2}
          y={H / 2}
          fontSize={10}
          textAnchor="middle"
          fill="#000"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          warming up...
        </text>
      </svg>
    );
  }

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (frac: number) => PAD_T + plotH - frac * plotH;

  const stacked: Array<{ trial: number; cum: number[] }> = history.map(
    (snap) => {
      let acc = 0;
      const cum: number[] = [];
      for (const v of variants) {
        acc += snap.alloc[v.id] ?? 0;
        cum.push(acc);
      }
      return { trial: snap.trial, cum };
    },
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* axes frame */}
      <rect
        x={PAD_L}
        y={PAD_T}
        width={plotW}
        height={plotH}
        fill="none"
        stroke="#000"
        strokeWidth={1}
      />

      <text
        x={PAD_L - 4}
        y={PAD_T + 4}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        100%
      </text>
      <text
        x={PAD_L - 4}
        y={PAD_T + plotH}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0%
      </text>

      <text
        x={PAD_L}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="start"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0
      </text>
      <text
        x={W - PAD_R}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {sim.trial}
      </text>

      {variants.map((v, i) => {
        const topPts = stacked.map(
          (s) =>
            `${xPx(s.trial).toFixed(1)},${yPx(s.cum[i]).toFixed(1)}`,
        );
        const bottomPts = stacked
          .slice()
          .reverse()
          .map(
            (s) =>
              `${xPx(s.trial).toFixed(1)},${yPx(i === 0 ? 0 : s.cum[i - 1]).toFixed(1)}`,
          );
        const points = topPts.concat(bottomPts).join(" ");
        return (
          <polygon
            key={v.id}
            points={points}
            fill={v.color}
            stroke="none"
          />
        );
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Chart — posterior conversion rate distributions (overlay)
   ──────────────────────────────────────────────────────────────── */

function PosteriorDistributionsChart({
  variants,
}: {
  variants: Variant[];
}) {
  const W = 520;
  const H = 200;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const X_MIN = 0;
  const X_MAX = 0.5;
  const SAMPLES = 160;

  const curves = useMemo(() => {
    let yMax = 0;
    const list = variants.map((v) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 1; i < SAMPLES; i++) {
        const x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLES;
        const y = betaPdf(x, v.alpha, v.beta);
        pts.push({ x, y });
        if (y > yMax) yMax = y;
      }
      return { variant: v, pts };
    });
    if (yMax <= 0) yMax = 1;
    return { list, yMax };
  }, [variants]);

  const xPx = (x: number) =>
    PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const yPx = (y: number) =>
    PAD_T + plotH - (y / curves.yMax) * plotH;

  const xTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={PAD_T + plotH}
        y2={PAD_T + plotH}
        stroke="#000"
        strokeWidth={1}
      />

      {xTicks.map((t) => (
        <g key={t}>
          <line
            x1={xPx(t)}
            x2={xPx(t)}
            y1={PAD_T + plotH}
            y2={PAD_T + plotH + 4}
            stroke="#000"
            strokeWidth={1}
          />
          <text
            x={xPx(t)}
            y={PAD_T + plotH + 16}
            fontSize={10}
            textAnchor="middle"
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {(t * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      {curves.list.map(({ variant, pts }) => {
        const opacity = variant.status === "active" ? 1 : 0.25;
        const d = pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xPx(p.x).toFixed(2)} ${yPx(p.y).toFixed(2)}`,
          )
          .join(" ");
        const mean = betaMean(variant.alpha, variant.beta);
        // Peak height of the PDF — used to anchor the top of the mean line.
        let peakY = 0;
        for (const p of pts) if (p.y > peakY) peakY = p.y;
        const meanInRange = mean >= X_MIN && mean <= X_MAX;
        return (
          <g key={variant.id} opacity={opacity}>
            <path
              d={d}
              fill="none"
              stroke={variant.color}
              strokeWidth={1.5}
            />
            {meanInRange && (
              <line
                x1={xPx(mean)}
                x2={xPx(mean)}
                y1={yPx(peakY)}
                y2={PAD_T + plotH}
                stroke={variant.color}
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.7}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────
   Chart 3 — comparison (Eigen vs Uniform) — the money chart
   ──────────────────────────────────────────────────────────────── */

function ComparisonChart({ sim }: { sim: SimState }) {
  const W = 520;
  const H = 240;
  const PAD_L = 40;
  const PAD_R = 80;
  const PAD_T = 14;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const trial = Math.max(sim.trial, 1);
  const eigenH = sim.eigenHistory;
  const uniformH = sim.uniformHistory;

  // Auto y-scale
  let yMax = 0.05;
  let yMin = Infinity;
  for (const p of eigenH) {
    if (p.rate > yMax) yMax = p.rate;
    if (p.rate < yMin) yMin = p.rate;
  }
  for (const p of uniformH) {
    if (p.rate > yMax) yMax = p.rate;
    if (p.rate < yMin) yMin = p.rate;
  }
  if (!isFinite(yMin)) yMin = 0;
  // Add some headroom and floor at 0
  yMax = yMax * 1.15;
  yMin = Math.max(0, yMin * 0.85);
  if (yMax - yMin < 0.02) yMax = yMin + 0.02;

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (y: number) => PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const buildPath = (pts: RatePoint[]) => {
    if (pts.length < 2) return "";
    return pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${xPx(p.trial).toFixed(1)} ${yPx(p.rate).toFixed(1)}`,
      )
      .join(" ");
  };

  const eigenLast = eigenH[eigenH.length - 1];
  const uniformLast = uniformH[uniformH.length - 1];

  const eigenRate = eigenLast?.rate ?? 0;
  const uniformRate = uniformLast?.rate ?? 0;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* axes */}
      <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#000" strokeWidth={1} />
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + plotH} stroke="#000" strokeWidth={1} />

      {/* y endpoints */}
      <text x={PAD_L - 4} y={PAD_T + 4} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {(yMax * 100).toFixed(1)}%
      </text>
      <text x={PAD_L - 4} y={PAD_T + plotH} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {(yMin * 100).toFixed(1)}%
      </text>

      {/* x endpoints */}
      <text x={PAD_L} y={PAD_T + plotH + 16} fontSize={10} textAnchor="start" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        0
      </text>
      <text x={W - PAD_R} y={PAD_T + plotH + 16} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {sim.trial}
      </text>

      {/* uniform line — dashed, 1px */}
      <path d={buildPath(uniformH)} fill="none" stroke="#000" strokeWidth={1} strokeDasharray="5 4" />
      {/* eigen line — solid, 2px */}
      <path d={buildPath(eigenH)} fill="none" stroke="#000" strokeWidth={2} />

      {/* labels at the right end */}
      {eigenLast && (
        <g>
          <line
            x1={xPx(eigenLast.trial)}
            x2={W - PAD_R + 6}
            y1={yPx(eigenLast.rate)}
            y2={yPx(eigenLast.rate)}
            stroke="#000"
            strokeWidth={1}
          />
          <text
            x={W - PAD_R + 8}
            y={yPx(eigenLast.rate) + 3}
            fontSize={10}
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            EIGEN: {(eigenRate * 100).toFixed(1)}%
          </text>
        </g>
      )}
      {uniformLast && (
        <g>
          <line
            x1={xPx(uniformLast.trial)}
            x2={W - PAD_R + 6}
            y1={yPx(uniformLast.rate)}
            y2={yPx(uniformLast.rate)}
            stroke="#000"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text
            x={W - PAD_R + 8}
            y={yPx(uniformLast.rate) + 3}
            fontSize={10}
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            UNIFORM: {(uniformRate * 100).toFixed(1)}%
          </text>
        </g>
      )}
    </svg>
  );
}
