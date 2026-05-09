import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrg } from "@/app/_lib/auth/org";
import { getCampaign } from "@/app/_lib/campaigns/queries";
import { updateCampaign } from "@/app/_lib/campaigns/actions";
import { CampaignForm } from "@/app/app/campaigns/_components/CampaignForm";

type Params = Promise<{ id: string }>;

export default async function EditCampaignPage({ params }: { params: Params }) {
  const { id } = await params;
  const { greetingName } = await requireOrg();
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="max-w-2xl">
      <Link
        href={`/campaigns/${campaign.id}`}
        className="text-xs text-ink/50 hover:text-ink/80"
      >
        ← {campaign.name}
      </Link>
      <h1 className="font-serif text-3xl mt-2 mb-8">Edit campaign</h1>
      <CampaignForm
        action={updateCampaign}
        defaults={{
          id: campaign.id,
          name: campaign.name,
          baselineSubject: campaign.baselineSubject,
          baselineBodyMd: campaign.baselineBodyMd,
        }}
        greetingName={greetingName}
        submitLabel="Save changes"
        pendingLabel="Saving…"
      />
    </div>
  );
}
