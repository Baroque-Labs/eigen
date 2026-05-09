import Link from "next/link";

export default function CampaignsPage() {
  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="px-3 py-1.5 text-sm rounded bg-ink text-paper hover:bg-ink/90"
        >
          + New campaign
        </Link>
      </div>
      <div className="border border-ink/10 rounded-lg p-12 text-center text-ink/60">
        <p className="text-sm">No campaigns yet.</p>
        <p className="text-sm mt-1">
          Create one to draft a baseline email and let Eigen explore variants.
        </p>
      </div>
    </div>
  );
}
