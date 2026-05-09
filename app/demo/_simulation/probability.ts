import { sampleBeta } from "@/app/_lib/beta";
import type { Variant } from "../_types";
import { PROB_BEST_SAMPLES } from "../_constants";
import { clamp, randUniform } from "./tick";

// Monte-Carlo estimate of Pr(variant is the best) by sampling each posterior.
export function probabilityBest(active: Variant[]): Map<string, number> {
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

// Standalone variant true-rate sampler — used for the initial 3 variants.
// Baseline rate is then the *mean* of these, so the baseline can never beat
// the strongest variant by construction. Range is configurable by the user.
export function sampleStandaloneVariantRate(min: number, max: number): number {
  const lo = Math.max(0, Math.min(min, max));
  const hi = Math.min(1, Math.max(min, max));
  return clamp(randUniform(lo, hi), 0, 1);
}

// Replacement variants are seeded around the surviving winner's true rate.
export function sampleVariantRate(seed: number): number {
  return clamp(seed + randUniform(-0.10, 0.10), 0.02, 0.30);
}
