// Campaign queries. As of feat/dashboard, the canonical store for
// campaigns/variants/sends/posteriors is eigen-backend — these functions
// proxy to backend rather than reading from Drizzle directly.
//
// Drizzle remains the source of truth for organizations, memberships, and
// the per-org backend API key (api_keys table).

import "server-only";
import {
  listCampaigns as backendList,
  getCampaignState,
  type CampaignListItem,
  type CampaignState,
} from "@/app/_lib/backend/campaigns";

export type CampaignRow = CampaignListItem;

export async function listCampaigns(): Promise<CampaignListItem[]> {
  return backendList();
}

export async function getCampaign(id: string | number): Promise<CampaignState | null> {
  const numId = typeof id === "string" ? Number(id) : id;
  if (!Number.isFinite(numId)) return null;
  try {
    return await getCampaignState(numId);
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes("backend 404")) return null;
    throw e;
  }
}
