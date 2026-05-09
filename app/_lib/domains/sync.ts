// Server-only helpers that pull current Resend state into our DB.
// Lives outside the "use server" actions module so server-component
// renders can call it directly (Next 16 disallows revalidatePath
// during render, so callers in render paths skip the revalidate; the
// action wrappers handle revalidate themselves).

import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";
import { getResend } from "@/app/_lib/resend/client";

export type DomainStatus = "pending" | "verified" | "failed";

export type DomainRecord = {
  record?: string;
  name: string;
  type: string;
  value: string;
  ttl?: string | number;
  priority?: number;
  status?: string;
};

export type SyncResult = {
  status: DomainStatus;
  records: DomainRecord[];
};

export function mapResendStatus(status: string | undefined | null): DomainStatus {
  if (status === "verified") return "verified";
  if (status === "failed") return "failed";
  return "pending";
}

// Pulls Resend state, updates our DB silently if status changed, and
// returns fresh records. Does NOT call revalidatePath — that's the
// caller's responsibility when running outside a render.
export async function syncDomainFromResend(
  domainId: string,
  opts: { triggerVerify: boolean } = { triggerVerify: false },
): Promise<SyncResult> {
  const { org } = await requireOrg();
  const db = getDb();
  const rows = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, domainId), eq(domains.orgId, org.id)))
    .limit(1);
  const row = rows[0];
  if (!row || !row.resendDomainId) {
    return { status: row?.status ?? "pending", records: [] };
  }

  const resend = getResend();

  if (opts.triggerVerify) {
    // Resend's verify endpoint queues a fresh DNS lookup. The status
    // update lands a few seconds later, so wait briefly before reading.
    await resend.domains.verify(row.resendDomainId);
    await new Promise((r) => setTimeout(r, 1500));
  }

  const got = await resend.domains.get(row.resendDomainId);
  if (got.error || !got.data) {
    return { status: row.status, records: [] };
  }

  const newStatus = mapResendStatus(got.data.status);
  const records = (got.data.records ?? []) as DomainRecord[];

  if (newStatus !== row.status) {
    await db
      .update(domains)
      .set({
        status: newStatus,
        verifiedAt: newStatus === "verified" ? new Date() : null,
      })
      .where(eq(domains.id, row.id));
  }

  return { status: newStatus, records };
}
