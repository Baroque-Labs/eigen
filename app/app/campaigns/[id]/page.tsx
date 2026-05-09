import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign } from "@/app/_lib/campaigns/queries";

type Params = Promise<{ id: string }>;

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Running",
  paused: "Paused",
  done: "Done",
};

export default async function CampaignDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  return (
    <div className="max-w-3xl">
      <Link
        href="/campaigns"
        className="text-xs text-ink/50 hover:text-ink/80"
      >
        ← Campaigns
      </Link>
      <div className="flex items-baseline justify-between mt-2 mb-1">
        <h1 className="font-serif text-3xl">{campaign.name}</h1>
        <span className="text-xs text-ink/50">
          {STATUS_LABEL[campaign.status] ?? campaign.status}
        </span>
      </div>
      <p className="text-xs font-mono text-ink/40 mb-8">{campaign.id}</p>

      <section className="border border-ink/10 rounded-lg p-6 mb-6">
        <h2 className="text-xs uppercase tracking-wider text-ink/50 mb-3">
          Baseline email
        </h2>
        <div className="text-sm font-medium mb-2">{campaign.baselineSubject}</div>
        <pre className="text-sm whitespace-pre-wrap font-sans text-ink/80">
          {campaign.baselineBodyMd}
        </pre>
      </section>

      <section className="border border-ink/10 rounded-lg p-6 text-sm text-ink/60">
        <h2 className="text-xs uppercase tracking-wider text-ink/50 mb-3">
          Next up
        </h2>
        <ol className="list-decimal pl-5 space-y-1">
          <li>Verify a sending domain in Domains.</li>
          <li>Eigen generates variants — approve them in the queue.</li>
          <li>Upload a recipient list and launch.</li>
        </ol>
      </section>
    </div>
  );
}
