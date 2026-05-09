import Link from "next/link";
import { listCampaigns } from "@/app/_lib/campaigns/queries";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
  done: "Done",
};

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

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

      {campaigns.length === 0 ? (
        <div className="border border-ink/10 rounded-lg p-12 text-center text-ink/60">
          <p className="text-sm">No campaigns yet.</p>
          <p className="text-sm mt-1">
            Create one to draft a baseline email and let Eigen explore variants.
          </p>
        </div>
      ) : (
        <ul className="border border-ink/10 rounded-lg divide-y divide-ink/10">
          {campaigns.map((c) => (
            <li key={c.id}>
              <Link
                href={`/campaigns/${c.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ink/5"
              >
                <div>
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-xs text-ink/50 mt-0.5">
                    {c.baselineSubject}
                  </div>
                </div>
                <div className="text-xs text-ink/50">
                  {STATUS_LABEL[c.status] ?? c.status}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
