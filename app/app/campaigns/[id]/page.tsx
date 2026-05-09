import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign } from "@/app/_lib/campaigns/queries";
import { getVerifiedDomain } from "@/app/_lib/domains/queries";
import { SendTestButton } from "./SendTestButton";

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
  const verifiedDomain = await getVerifiedDomain();

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
        <div className="flex items-center gap-3">
          <Link
            href={`/campaigns/${campaign.id}/edit`}
            className="text-xs text-ink/50 hover:text-ink/80"
          >
            Edit
          </Link>
          <span className="text-xs text-ink/50">
            {STATUS_LABEL[campaign.status] ?? campaign.status}
          </span>
        </div>
      </div>
      <p className="text-xs font-mono text-ink/40 mb-8">{campaign.id}</p>

      <section className="border border-ink/10 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-ink/50">
            Baseline email
          </h2>
          {verifiedDomain ? (
            <SendTestButton campaignId={campaign.id} />
          ) : (
            <Link
              href="/domains"
              className="text-xs text-ink/50 hover:text-ink/80"
            >
              Verify a domain to enable test sends →
            </Link>
          )}
        </div>
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
          <li>
            {verifiedDomain
              ? `Sending domain ${verifiedDomain.hostname} is verified.`
              : "Verify a sending domain in Domains."}
          </li>
          <li>Eigen generates variants — approve them in the queue.</li>
          <li>Upload a recipient list and launch.</li>
        </ol>
      </section>
    </div>
  );
}
