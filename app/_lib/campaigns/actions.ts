"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getDb } from "@/db";
import { campaigns } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";

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
