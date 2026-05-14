// Typed wrappers around the eigen-backend campaign endpoints.

import "server-only";
import { backendFetch } from "@/app/_lib/backend/client";

export type CampaignListItem = {
  id: number;
  name: string;
  status: "running" | "stopped";
  n_variants: number;
  active_variants: number;
  total_sends: number;
  total_clicks: number;
  created_at: string;
};

export type CohortPosterior = {
  cohort: string;
  alpha: number;
  beta: number;
  mean: number;
  samples: number;
  prob_best: number;
};

export type VariantState = {
  id: number;
  subject: string;
  body: string;
  status: "active" | "pending" | "killed" | "rejected";
  parent_id: number | null;
  cohorts: CohortPosterior[];
};

export type CampaignState = {
  id: number;
  name: string;
  status: "running" | "stopped";
  n_variants: number;
  n_batches: number;
  batch_size: number;
  variants: VariantState[];
  total_sends: number;
  total_clicks: number;
  stopped_reason: string | null;
};

export type Decision = {
  id: number;
  kind: "kill" | "spawn" | "stop";
  variant_id: number | null;
  reason: string;
  snapshot: Record<string, unknown>;
  at: string;
};

export type PendingVariant = {
  id: number;
  subject: string;
  body: string;
  parent_id: number | null;
};

export type TimeseriesPoint = {
  bucket_start: number;
  sends: number;
  clicks: number;
};

export async function listCampaigns(): Promise<CampaignListItem[]> {
  const res = await backendFetch<{ campaigns: CampaignListItem[] }>(
    "/campaigns",
  );
  return res.campaigns;
}

export async function getCampaignState(id: number): Promise<CampaignState> {
  return backendFetch<CampaignState>(`/campaigns/${id}/state`);
}

export async function getDecisions(id: number): Promise<Decision[]> {
  const res = await backendFetch<{ decisions: Decision[] }>(
    `/campaigns/${id}/decisions`,
  );
  return res.decisions;
}

export async function getPendingVariants(id: number): Promise<PendingVariant[]> {
  const res = await backendFetch<{ variants: PendingVariant[] }>(
    `/campaigns/${id}/pending`,
  );
  return res.variants;
}

export async function getTimeseries(
  id: number,
  intervalSeconds = 3600,
): Promise<TimeseriesPoint[]> {
  const res = await backendFetch<{ points: TimeseriesPoint[] }>(
    `/campaigns/${id}/timeseries?interval_seconds=${intervalSeconds}`,
  );
  return res.points;
}

export type CreateCampaignInput = {
  name: string;
  baseline: { subject: string; body: string };
  n_variants: number;
  n_batches: number;
  emails: string[];
};

export async function createCampaign(
  input: CreateCampaignInput,
): Promise<{ id: number; name: string; batch_size: number; n_variants: number }> {
  return backendFetch(`/campaigns`, { body: input });
}

export async function approveVariant(campaignId: number, variantId: number) {
  return backendFetch(
    `/campaigns/${campaignId}/variants/${variantId}/approve`,
    { method: "POST", body: {} },
  );
}

export async function rejectVariant(campaignId: number, variantId: number) {
  return backendFetch(
    `/campaigns/${campaignId}/variants/${variantId}/reject`,
    { method: "POST", body: {} },
  );
}

export async function tickCampaign(id: number) {
  return backendFetch(`/campaigns/${id}/tick`, { method: "POST", body: {} });
}

export async function runResearch(id: number) {
  return backendFetch(`/campaigns/${id}/research`, {
    method: "POST",
    body: {},
  });
}

export async function addRecipients(
  id: number,
  emails: string[],
): Promise<{ added: number }> {
  return backendFetch(`/campaigns/${id}/recipients`, { body: { emails } });
}
