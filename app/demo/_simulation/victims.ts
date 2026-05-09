import { betaMean } from "@/app/_lib/beta";
import type { SimState } from "../_types";
import {
  MAX_GAP_BETWEEN_GEN,
  MIN_GAP_BETWEEN_GEN,
  MIN_IMPRESSIONS_FOR_RETIREMENT,
  REPLACEMENT_COUNT,
  TAIL_THRESHOLD,
} from "../_constants";
import { probabilityBest } from "./probability";

// Returns the ids of variants to retire — empty if no generation should fire.
export function selectVictims(sim: SimState): string[] {
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
