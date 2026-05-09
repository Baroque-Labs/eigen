import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";

export type DomainRow = typeof domains.$inferSelect;

export async function listDomains(): Promise<DomainRow[]> {
  const { org } = await requireOrg();
  const db = getDb();
  return db
    .select()
    .from(domains)
    .where(eq(domains.orgId, org.id))
    .orderBy(desc(domains.createdAt));
}

export async function getDomain(id: string): Promise<DomainRow | null> {
  const { org } = await requireOrg();
  const db = getDb();
  const rows = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, id), eq(domains.orgId, org.id)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getVerifiedDomain(): Promise<DomainRow | null> {
  const { org } = await requireOrg();
  const db = getDb();
  const rows = await db
    .select()
    .from(domains)
    .where(and(eq(domains.orgId, org.id), eq(domains.status, "verified")))
    .orderBy(desc(domains.verifiedAt))
    .limit(1);
  return rows[0] ?? null;
}
