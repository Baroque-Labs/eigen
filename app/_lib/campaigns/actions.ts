"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";
import { requireOrg } from "@/app/_lib/auth/org";
import { getVerifiedDomain } from "@/app/_lib/domains/queries";
import { getResend } from "@/app/_lib/resend/client";
import {
  renderMarkdown,
  renderPlainText,
} from "@/app/_lib/markdown/render";
import { sanitizeEmailHtml } from "@/app/_lib/markdown/sanitize";
import {
  addRecipients,
  approveVariant as backendApprove,
  createCampaign as backendCreate,
  getCampaignState,
  rejectVariant as backendReject,
  runResearch,
  tickCampaign,
} from "@/app/_lib/backend/campaigns";

export type CampaignFormResult = {
  error?: string;
};

type ParsedFields = {
  name: string;
  baselineSubject: string;
  baselineBodyMd: string;
  emails: string[];
  nVariants: number;
  nBatches: number;
};

function parseEmails(raw: string): string[] {
  return raw
    .split(/[\s,;]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s));
}

function parseCampaignFields(formData: FormData): ParsedFields | string {
  const name = String(formData.get("name") ?? "").trim();
  const baselineSubject = String(formData.get("baseline_subject") ?? "").trim();
  const baselineBodyMd = String(formData.get("baseline_body_md") ?? "").trim();
  const emailsRaw = String(formData.get("emails") ?? "");
  const nVariants = Number(formData.get("n_variants") ?? 4);
  const nBatches = Number(formData.get("n_batches") ?? 10);
  if (!name) return "Name is required.";
  if (!baselineSubject) return "Baseline subject is required.";
  if (!baselineBodyMd) return "Baseline body is required.";
  const emails = parseEmails(emailsRaw);
  if (emails.length === 0) return "Add at least one valid recipient email.";
  if (!Number.isFinite(nVariants) || nVariants < 1 || nVariants > 64) {
    return "Variants must be between 1 and 64.";
  }
  if (!Number.isFinite(nBatches) || nBatches < 1) {
    return "Batches must be a positive integer.";
  }
  return { name, baselineSubject, baselineBodyMd, emails, nVariants, nBatches };
}

export async function createCampaign(
  _prev: CampaignFormResult | null,
  formData: FormData,
): Promise<CampaignFormResult> {
  await requireOrg();
  const parsed = parseCampaignFields(formData);
  if (typeof parsed === "string") return { error: parsed };

  const created = await backendCreate({
    name: parsed.name,
    baseline: {
      subject: parsed.baselineSubject,
      body: parsed.baselineBodyMd,
    },
    n_variants: parsed.nVariants,
    n_batches: parsed.nBatches,
    emails: parsed.emails,
  });

  revalidatePath("/campaigns");
  redirect(`/campaigns/${created.id}`);
}

export type SendTestResult = {
  ok?: true;
  to?: string;
  error?: string;
};

// One-shot test send: pulls the org's verified domain, sends the campaign's
// baseline subject/body via Resend to the signed-in user's primary email.
// Reads campaign metadata from the backend; the baseline is the variant with
// parent_id == null.
export async function sendTestEmail(
  _prev: SendTestResult | null,
  formData: FormData,
): Promise<SendTestResult> {
  const { greetingName } = await requireOrg();
  const campaignId = Number(formData.get("campaign_id") ?? "");
  if (!Number.isFinite(campaignId)) return { error: "Missing campaign id." };

  const user = await currentUser();
  const to = user?.primaryEmailAddress?.emailAddress;
  if (!to) return { error: "No email on your Clerk account." };

  const domain = await getVerifiedDomain();
  if (!domain) {
    return {
      error: "Verify a sending domain in Domains before sending a test.",
    };
  }

  const state = await getCampaignState(campaignId);
  const baseline = state.variants.find((v) => v.parent_id === null);
  if (!baseline) return { error: "Campaign has no baseline variant." };

  const mergeValues = { first_name: greetingName };
  const html = renderMarkdown(baseline.body, mergeValues, {
    sanitize: sanitizeEmailHtml,
  });
  const text = renderPlainText(baseline.body, mergeValues);
  const subject = renderPlainText(baseline.subject, mergeValues);

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

// Approve / reject pending LLM-generated variants.
export async function approveVariantAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireOrg();
  const cid = Number(formData.get("campaign_id"));
  const vid = Number(formData.get("variant_id"));
  if (!Number.isFinite(cid) || !Number.isFinite(vid)) {
    return { error: "Missing campaign or variant id." };
  }
  await backendApprove(cid, vid);
  revalidatePath(`/campaigns/${cid}/pending`);
  revalidatePath(`/campaigns/${cid}`);
  return {};
}

export async function rejectVariantAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireOrg();
  const cid = Number(formData.get("campaign_id"));
  const vid = Number(formData.get("variant_id"));
  if (!Number.isFinite(cid) || !Number.isFinite(vid)) {
    return { error: "Missing campaign or variant id." };
  }
  await backendReject(cid, vid);
  revalidatePath(`/campaigns/${cid}/pending`);
  revalidatePath(`/campaigns/${cid}`);
  return {};
}

// Kick off the campaign — runs one batch through the backend. In production
// the scheduler will keep ticking. For MVP this gives an instant first-batch
// after Launch.
export async function launchCampaignAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireOrg();
  const cid = Number(formData.get("campaign_id"));
  if (!Number.isFinite(cid)) return { error: "Missing campaign id." };
  await tickCampaign(cid);
  revalidatePath(`/campaigns/${cid}`);
  return {};
}

export async function runResearchAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  await requireOrg();
  const cid = Number(formData.get("campaign_id"));
  if (!Number.isFinite(cid)) return { error: "Missing campaign id." };
  await runResearch(cid);
  revalidatePath(`/campaigns/${cid}`);
  return {};
}

export async function addRecipientsAction(
  _prev: { error?: string; added?: number } | null,
  formData: FormData,
): Promise<{ error?: string; added?: number }> {
  await requireOrg();
  const cid = Number(formData.get("campaign_id"));
  if (!Number.isFinite(cid)) return { error: "Missing campaign id." };
  const emails = parseEmails(String(formData.get("emails") ?? ""));
  if (emails.length === 0) return { error: "Add at least one valid email." };
  const res = await addRecipients(cid, emails);
  revalidatePath(`/campaigns/${cid}`);
  return { added: res.added };
}
