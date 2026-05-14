import Link from "next/link";
import { listCampaigns } from "@/app/_lib/campaigns/queries";

const STATUS_LABEL: Record<string, string> = {
  running: "RUNNING",
  stopped: "STOPPED",
};

function ctrLabel(clicks: number, sends: number): string {
  if (sends === 0) return "—";
  return `${((clicks / sends) * 100).toFixed(1)}%`;
}

export default async function CampaignsPage() {
  const campaigns = await listCampaigns();

  return (
    <div className="max-w-5xl">
      <div className="flex items-baseline justify-between mb-10">
        <h1 className="font-serif text-4xl tracking-tight">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] bg-ink text-paper hover:bg-ink/90"
        >
          New campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <div className="border border-ink/10 p-16 text-center">
          <p className="font-serif text-2xl text-ink/70 mb-2">No campaigns yet.</p>
          <p className="text-sm text-ink/50">
            Draft a baseline email and let Eigen explore variants.
          </p>
        </div>
      ) : (
        <div className="border border-ink/10">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-3 border-b border-ink/10 text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50">
            <div>Campaign</div>
            <div>Status</div>
            <div className="text-right">Variants</div>
            <div className="text-right">Sends</div>
            <div className="text-right">CTR</div>
          </div>
          {campaigns.map((c) => (
            <Link
              key={c.id}
              href={`/campaigns/${c.id}`}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-4 py-4 border-b border-ink/10 last:border-b-0 hover:bg-ink/[0.02] items-baseline"
            >
              <div>
                <div className="font-serif text-xl leading-tight">{c.name}</div>
                <div className="text-[10px] font-mono text-ink/40 mt-1">
                  #{c.id}
                </div>
              </div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/70">
                {STATUS_LABEL[c.status] ?? c.status}
              </div>
              <div className="text-right font-mono text-sm tabular-nums">
                {c.active_variants}
                <span className="text-ink/40">/{c.n_variants}</span>
              </div>
              <div className="text-right font-mono text-sm tabular-nums">
                {c.total_sends.toLocaleString()}
              </div>
              <div className="text-right font-mono text-sm tabular-nums">
                {ctrLabel(c.total_clicks, c.total_sends)}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
