"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { domains } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";
import { getResend } from "@/app/_lib/resend/client";
import { mapResendStatus, syncDomainFromResend } from "./sync";

const HOSTNAME_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

export type AddDomainResult = { error?: string };

export async function addDomain(
  _prev: AddDomainResult | null,
  formData: FormData,
): Promise<AddDomainResult> {
  const { org } = await requireOrg();
  const hostname = String(formData.get("hostname") ?? "").trim().toLowerCase();
  if (!hostname) return { error: "Hostname is required." };
  if (!HOSTNAME_RE.test(hostname)) {
    return { error: "Enter a valid hostname (e.g. mail.example.com)." };
  }

  const db = getDb();
  // Block duplicates within the org so we don't create orphan Resend
  // records on retry.
  const existing = await db
    .select({ id: domains.id })
    .from(domains)
    .where(and(eq(domains.orgId, org.id), eq(domains.hostname, hostname)))
    .limit(1);
  if (existing.length > 0) {
    redirect(`/domains/${existing[0].id}`);
  }

  const resend = getResend();

  // Resend's free tier caps domain count, so creating one when the
  // account already has a matching record fails with a plan-limit
  // error. List first and adopt the existing record when the hostname
  // matches — that way re-running this action is idempotent and
  // multiple Eigen orgs can share a Resend account that already has
  // its sending domain set up out-of-band.
  const list = await resend.domains.list();
  const existingInResend = list.data?.data.find((d) => d.name === hostname);

  let resendId: string;
  let status: "pending" | "verified" | "failed";

  if (existingInResend) {
    resendId = existingInResend.id;
    status = mapResendStatus(existingInResend.status);
  } else {
    const created = await resend.domains.create({ name: hostname });
    if (created.error || !created.data) {
      const msg = created.error?.message ?? "Failed to register domain with Resend.";
      if (msg.toLowerCase().includes("plan")) {
        const occupant = list.data?.data[0]?.name;
        return {
          error: occupant
            ? `Resend's plan caps you at 1 domain. ${occupant} is already registered — delete it from resend.com/domains, or use that hostname here.`
            : msg,
        };
      }
      return { error: msg };
    }
    resendId = created.data.id;
    status = mapResendStatus(created.data.status);
  }

  const [row] = await db
    .insert(domains)
    .values({
      orgId: org.id,
      hostname,
      resendDomainId: resendId,
      status,
      verifiedAt: status === "verified" ? new Date() : null,
    })
    .returning({ id: domains.id });

  revalidatePath("/domains");
  redirect(`/domains/${row.id}`);
}

// Forced re-verify — fires Resend's verify endpoint to make them
// re-query DNS, then refreshes the cached pages so the new status
// shows up in the list as well as the detail view.
export async function recheckDomainAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await syncDomainFromResend(id, { triggerVerify: true });
  revalidatePath("/domains");
  revalidatePath(`/domains/${id}`);
}
