import Link from "next/link";
import { requireOrg } from "@/app/_lib/auth/org";
import { createCampaign } from "@/app/_lib/campaigns/actions";
import { CampaignForm } from "@/app/app/campaigns/_components/CampaignForm";

export default async function NewCampaignPage() {
  const { greetingName } = await requireOrg();

  return (
    <div className="max-w-2xl">
      <Link
        href="/campaigns"
        className="text-xs text-ink/50 hover:text-ink/80"
      >
        ← Campaigns
      </Link>
      <h1 className="font-serif text-3xl mt-2 mb-1">New campaign</h1>
      <p className="text-sm text-ink/60 mb-8">
        Draft a baseline email. Eigen will generate variants from it once you
        approve them.
      </p>
      <CampaignForm
        action={createCampaign}
        greetingName={greetingName}
        submitLabel="Create campaign"
        pendingLabel="Creating…"
      />
    </div>
  );
}
