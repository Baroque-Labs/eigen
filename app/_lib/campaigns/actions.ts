"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { currentUser } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";
import { getVerifiedDomain } from "@/app/_lib/domains/queries";
import { getResend } from "@/app/_lib/resend/client";

export type CreateCampaignResult = {
  error?: string;
};

export async function createCampaign(
  _prev: CreateCampaignResult | null,
  formData: FormData,
): Promise<CreateCampaignResult> {
  const { org } = await requireOrg();

  const name = String(formData.get("name") ?? "").trim();
  const baselineSubject = String(formData.get("baseline_subject") ?? "").trim();
  const baselineBodyMd = String(formData.get("baseline_body_md") ?? "").trim();

  if (!name) return { error: "Name is required." };
  if (!baselineSubject) return { error: "Baseline subject is required." };
  if (!baselineBodyMd) return { error: "Baseline body is required." };

  const db = getDb();
  const [created] = await db
    .insert(campaigns)
    .values({
      orgId: org.id,
      name,
      baselineSubject,
      baselineBodyMd,
    })
    .returning({ id: campaigns.id });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${created.id}`);
}

export type SendTestResult = {
  ok?: true;
  to?: string;
  error?: string;
};

// One-shot test send: pulls the org's verified domain, sends the
// campaign's baseline subject/body via Resend to the signed-in user's
// primary email. No variants, no link tracking, no merge fields — this
// is the smallest path that proves the send pipeline works.
export async function sendTestEmail(
  _prev: SendTestResult | null,
  formData: FormData,
): Promise<SendTestResult> {
  const { org } = await requireOrg();
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) return { error: "Missing campaign id." };

  const user = await currentUser();
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return { error: "No email on your Clerk account." };

  const domain = await getVerifiedDomain();
  if (!domain) {
    return {
      error: "Verify a sending domain in Domains before sending a test.",
    };
  }

  const db = getDb();
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(and(eq(campaigns.id, campaignId), eq(campaigns.orgId, org.id)))
    .limit(1);
  if (!campaign) return { error: "Campaign not found." };

  const resend = getResend();
  const result = await resend.emails.send({
    from: `Eigen <noreply@${domain.hostname}>`,
    to,
    subject: campaign.baselineSubject,
    text: campaign.baselineBodyMd,
  });
  if (result.error) {
    return { error: result.error.message };
  }

  return { ok: true, to };
}
