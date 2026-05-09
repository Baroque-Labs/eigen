export const STARTER_EMAIL = `Subject: We're closing the founding round at midnight

Hey there,

The founding round for Eigen closes at midnight tonight — 10 spots, $100 each, 50% off forever. After this, the next tier prices significantly higher and these spots are gone.

If you've been on the fence, this is the moment.

— Andrew`;

export const ROLLING_WINDOW = 100;
export const POSTERIOR_SNAPSHOT_INTERVAL = 20;
export const REPLACEMENT_COUNT = 2;
export const FADE_DURATION_MS = 1500;
export const FLASH_DURATION_MS = 2000;

// Generation rule — blends a confidence-of-underperformance check with a
// time-bounded fallback so the loop always progresses without thrashing.
export const GENERATION_CHECK_INTERVAL = 50;
export const MIN_GAP_BETWEEN_GEN = 200;
export const MAX_GAP_BETWEEN_GEN = 600;
export const MIN_IMPRESSIONS_FOR_RETIREMENT = 60;
export const TAIL_THRESHOLD = 0.05;
export const PROB_BEST_SAMPLES = 500;

// Hard stop on the demo: when a generation would mint variant #13 or beyond,
// we end the test instead and let the user reset.
export const MAX_VARIANTS = 12;

export const DEFAULT_MIN_RATE_PCT = 4;
export const DEFAULT_MAX_RATE_PCT = 30;

// Pulled from Monet's "Houses of Parliament" series — sunset, fog, stormy.
// Muted, painterly hues. Used only for variant identity; everything else
// stays black-and-white.
export const PAINT_PALETTE = [
  "#C0573B", // sunset orange
  "#3F5870", // fog slate-blue
  "#8B5E80", // dusk plum
  "#6B8478", // misty teal
  "#A6794D", // ochre
  "#5E6A8C", // storm violet
  "#80926A", // sage olive
  "#B07F4F", // burnt umber
];

export function colorFor(index: number): string {
  return PAINT_PALETTE[(index - 1) % PAINT_PALETTE.length];
}
