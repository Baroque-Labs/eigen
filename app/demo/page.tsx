"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { betaMean } from "@/app/_lib/beta";
import { GeneratingPhase } from "./_components/GeneratingPhase";
import { InputPhase } from "./_components/InputPhase";
import { Nav } from "./_components/Nav";
import { SimulationPhase } from "./_components/SimulationPhase";
import {
  colorFor,
  DEFAULT_MAX_RATE_PCT,
  DEFAULT_MIN_RATE_PCT,
  FADE_DURATION_MS,
  FLASH_DURATION_MS,
  GENERATION_CHECK_INTERVAL,
  MAX_VARIANTS,
  REPLACEMENT_COUNT,
  STARTER_EMAIL,
} from "./_constants";
import { parseInputEmail, variantToFullEmail } from "./_simulation/email";
import {
  sampleStandaloneVariantRate,
  sampleVariantRate,
} from "./_simulation/probability";
import { tickOnce } from "./_simulation/tick";
import { selectVictims } from "./_simulation/victims";
import type { ApiVariant, Phase, SimState, Variant } from "./_types";

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
