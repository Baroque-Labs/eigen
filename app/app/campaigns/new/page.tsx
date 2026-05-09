import Link from "next/link";
import { NewCampaignForm } from "./NewCampaignForm";

export default function NewCampaignPage() {
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
      <NewCampaignForm />
    </div>
  );
}
