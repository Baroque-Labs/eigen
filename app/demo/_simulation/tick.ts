import { betaMean, sampleBeta } from "@/app/_lib/beta";
import type { SimState } from "../_types";
import { POSTERIOR_SNAPSHOT_INTERVAL, ROLLING_WINDOW } from "../_constants";

export function randUniform(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

export function tickOnce(s: SimState): SimState {
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

  const recent =
    s.recentChoices.length >= ROLLING_WINDOW
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
