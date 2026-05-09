// Server-side queries for the campaigns surface. All queries scope to
// the caller's org via requireOrg() so a leaked campaign id can't be
// read across tenants.

import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";

export type CampaignRow = typeof campaigns.$inferSelect;

export async function listCampaigns(): Promise<CampaignRow[]> {
  const { org } = await requireOrg();
  const db = getDb();
  return db
    .select()
    .from(campaigns)
    .where(eq(campaigns.orgId, org.id))
    .orderBy(desc(campaigns.createdAt));
}

export async function getCampaign(id: string): Promise<CampaignRow | null> {
  const { org } = await requireOrg();
  const db = getDb();
  const rows = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, id), eq(campaigns.orgId, org.id)))
    .limit(1);
  return rows[0] ?? null;
}
