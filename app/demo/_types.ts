export type Phase = "input" | "generating" | "running";

export type Variant = {
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

export type AllocSnapshot = { trial: number; alloc: Record<string, number> };
export type RatePoint = { trial: number; rate: number };

export type SimState = {
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

export type ApiVariant = { subject: string; body: string; axis: string };
