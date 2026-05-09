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
import {
  renderMarkdown,
  renderPlainText,
} from "@/app/_lib/markdown/render";
import { sanitizeEmailHtml } from "@/app/_lib/markdown/sanitize";

export type CampaignFormResult = {
  error?: string;
};

type ParsedFields = {
  name: string;
  baselineSubject: string;
  baselineBodyMd: string;
};

function parseCampaignFields(formData: FormData): ParsedFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const baselineSubject = String(formData.get("baseline_subject") ?? "").trim();
  const baselineBodyMd = String(formData.get("baseline_body_md") ?? "").trim();
  if (!name) return "Name is required.";
  if (!baselineSubject) return "Baseline subject is required.";
  if (!baselineBodyMd) return "Baseline body is required.";
  return { name, baselineSubject, baselineBodyMd };
}

export async function createCampaign(
  _prev: CampaignFormResult | null,
  formData: FormData,
): Promise<CampaignFormResult> {
  const { org } = await requireOrg();
  const parsed = parseCampaignFields(formData);
  if (typeof parsed === "string") return { error: parsed };

  const db = getDb();
  const [created] = await db
    .insert(campaigns)
    .values({ orgId: org.id, ...parsed })
    .returning({ id: campaigns.id });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${created.id}`);
}

export async function updateCampaign(
  _prev: CampaignFormResult | null,
  formData: FormData,
): Promise<CampaignFormResult> {
  const { org } = await requireOrg();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing campaign id." };
  const parsed = parseCampaignFields(formData);
  if (typeof parsed === "string") return { error: parsed };

  const db = getDb();
  const result = await db
    .update(campaigns)
    .set(parsed)
    .where(and(eq(campaigns.id, id), eq(campaigns.orgId, org.id)))
    .returning({ id: campaigns.id });
  if (result.length === 0) return { error: "Campaign not found." };

  revalidatePath("/campaigns");
  revalidatePath(`/campaigns/${id}`);
  redirect(`/campaigns/${id}`);
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
  const { org, greetingName } = await requireOrg();
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

  // Test sends use the signed-in user's first name as the sample
  // merge value. Real campaigns will pull per-recipient values from
  // the recipients table (phase 3 part B).
  const mergeValues = { first_name: greetingName };
  const html = renderMarkdown(campaign.baselineBodyMd, mergeValues, {
    sanitize: sanitizeEmailHtml,
  });
  const text = renderPlainText(campaign.baselineBodyMd, mergeValues);
  const subject = renderPlainText(campaign.baselineSubject, mergeValues);

  const resend = getResend();
  const result = await resend.emails.send({
    from: `Eigen <noreply@${domain.hostname}>`,
    to,
    subject,
    html,
    text,
  });
  if (result.error) {
    return { error: result.error.message };
  }

  return { ok: true, to };
}
