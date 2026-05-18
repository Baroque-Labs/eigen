import Link from "next/link";
import { notFound } from "next/navigation";
import { getCampaign } from "@/app/_lib/campaigns/queries";
import { getDecisions, getPendingVariants } from "@/app/_lib/backend/campaigns";
import { getVerifiedDomain } from "@/app/_lib/domains/queries";
import { SendTestButton } from "./SendTestButton";
import { LaunchButton } from "./LaunchButton";
import { AutoRefresh } from "./_components/AutoRefresh";
import { DeleteCampaignButton } from "../_components/DeleteCampaignButton";

type Params = Promise<{ id: string }>;

function pct(n: number, places = 1): string {
  return `${(n * 100).toFixed(places)}%`;
}

function fmt(n: number, places = 2): string {
  return n.toFixed(places);
}

export default async function CampaignDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const campaign = await getCampaign(id);
  if (!campaign) notFound();

  const [decisions, pending, verifiedDomain] = await Promise.all([
    getDecisions(campaign.id),
    getPendingVariants(campaign.id),
    getVerifiedDomain(),
  ]);

  const baseline = campaign.variants.find((v) => v.parent_id === null);
  const allCohorts = Array.from(
    new Set(campaign.variants.flatMap((v) => v.cohorts.map((c) => c.cohort))),
  );

  return (
    <div className="max-w-5xl">
      <Link href="/campaigns" className="text-xs text-ink/50 hover:text-ink/80">
        ← Campaigns
      </Link>
      <div className="flex items-baseline justify-between mt-2 mb-1">
        <h1 className="font-serif text-4xl tracking-tight">{campaign.name}</h1>
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/70">
            {campaign.status}
          </span>
          {verifiedDomain && baseline ? (
            <SendTestButton campaignId={campaign.id} />
          ) : null}
          <LaunchButton campaignId={campaign.id} disabled={campaign.status !== "running"} />
          <DeleteCampaignButton campaignId={campaign.id} name={campaign.name} variant="labeled" />
        </div>
      </div>
      <div className="flex items-center justify-between mb-8">
        <p className="text-[10px] font-mono text-ink/40">
          #{campaign.id} · {campaign.total_sends.toLocaleString()} sends ·{" "}
          {campaign.total_clicks.toLocaleString()} clicks ·{" "}
          {campaign.total_sends > 0
            ? pct(campaign.total_clicks / campaign.total_sends)
            : "—"}{" "}
          CTR
        </p>
        <AutoRefresh intervalMs={3000} />
      </div>

      <div className="grid grid-cols-4 gap-6 mb-10 border border-ink/10 p-4">
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-1">
            Cadence
          </div>
          <div className="font-mono text-sm">
            {campaign.cadence_minutes} min · batch {campaign.batch_size}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-1">
            Days
          </div>
          <div className="font-mono text-sm">
            {campaign.calendar.weekdays.length
              ? campaign.calendar.weekdays
                  .map((d) => ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d])
                  .join(" ")
              : "any"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-1">
            Hours · {campaign.timezone}
          </div>
          <div className="font-mono text-sm">
            {campaign.calendar.hours.length
              ? `${Math.min(...campaign.calendar.hours)}–${Math.max(...campaign.calendar.hours)}`
              : "any"}
          </div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-1">
            Settle window
          </div>
          <div className="font-mono text-sm">
            {(campaign.settle_window_seconds / 3600).toFixed(1)} h
          </div>
        </div>
      </div>

      {campaign.status === "stopped" && campaign.stopped_reason ? (
        <div className="border-l-4 border-[#8B3A2C] pl-4 mb-8">
          <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8B3A2C]">
            Converged
          </div>
          <div className="font-serif text-lg mt-1">{campaign.stopped_reason}</div>
        </div>
      ) : null}

      {pending.length > 0 ? (
        <div className="mb-8 border border-ink/15 p-4 flex items-baseline justify-between">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50">
              Awaiting approval
            </div>
            <div className="font-serif text-xl">
              {pending.length} variant{pending.length === 1 ? "" : "s"} pending review
            </div>
          </div>
          <Link
            href={`/campaigns/${campaign.id}/pending`}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] bg-ink text-paper hover:bg-ink/90"
          >
            Review
          </Link>
        </div>
      ) : null}

      <section className="mb-12">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-4">
          Variants
        </div>
        <div className="border border-ink/10">
          {campaign.variants.map((v) => {
            const totalSent = v.cohorts.reduce((a, c) => a + c.sent, 0);
            const totalInFlight = v.cohorts.reduce((a, c) => a + c.in_flight, 0);
            const totalConverted = v.cohorts.reduce((a, c) => a + c.converted, 0);
            const totalLost = v.cohorts.reduce((a, c) => a + c.lost, 0);
            const ctr = totalSent > 0 ? totalConverted / totalSent : 0;
            return (
              <div
                key={v.id}
                className="border-b border-ink/10 last:border-b-0 px-4 py-4"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <div className="flex items-baseline gap-3">
                    <div className="font-serif text-lg leading-tight">
                      {v.subject}
                    </div>
                    {v.parent_id === null ? (
                      <span className="text-[9px] font-mono uppercase tracking-[0.14em] text-ink/40">
                        baseline
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.12em]">
                    <span className="text-ink/40">#{v.id}</span>
                    <span
                      className={
                        v.status === "active"
                          ? "text-ink/70"
                          : v.status === "killed"
                            ? "text-ink/30 line-through"
                            : "text-[#8B3A2C]"
                      }
                    >
                      {v.status}
                    </span>
                  </div>
                </div>
                {totalSent > 0 ? (
                  <div className="text-[10px] font-mono text-ink/40 tabular-nums mb-3">
                    {totalSent.toLocaleString()} sent · {totalInFlight} in flight ·{" "}
                    {totalConverted} converted · {totalLost} lost ·{" "}
                    <span className="text-ink/70">{pct(ctr, 1)} CTR</span>
                  </div>
                ) : (
                  <div className="text-[10px] font-mono text-ink/40 mb-3">
                    Not yet dispatched.
                  </div>
                )}
                {v.cohorts.length > 0 ? (
                  <div className="space-y-3">
                    {v.cohorts.map((c) => (
                      <div key={c.cohort} className="space-y-0.5">
                        <div className="grid grid-cols-[80px_1fr_60px_60px_60px] gap-3 items-center text-xs font-mono tabular-nums">
                          <div className="text-ink/60 uppercase tracking-[0.1em] truncate">
                            {c.cohort}
                          </div>
                          {/* CI bar: tick at mean across [0, 0.5]. Reference
                              marks every 10% so the scale is legible. */}
                          <div className="relative h-3 border-t border-b border-ink/15">
                            {[10, 20, 30, 40].map((p) => (
                              <div
                                key={p}
                                className="absolute top-1 bottom-1 w-px bg-ink/10"
                                style={{ left: `${p * 2}%` }}
                              />
                            ))}
                            <div
                              className="absolute top-0 bottom-0 w-px bg-ink"
                              style={{ left: `${Math.min(100, c.mean * 200)}%` }}
                              title={`mean=${fmt(c.mean, 3)}`}
                            />
                          </div>
                          <div className="text-right text-ink/70">{pct(c.mean, 2)}</div>
                          <div className="text-right text-ink/50">
                            n={Math.round(c.samples)}
                          </div>
                          <div className="text-right text-ink/70">
                            {pct(c.prob_best, 0)}
                          </div>
                        </div>
                        {c.sent > 0 ? (
                          <div className="grid grid-cols-[80px_1fr] gap-3 text-[10px] font-mono tabular-nums text-ink/40">
                            <div />
                            <div>
                              {c.sent} sent ·{" "}
                              <span className={c.in_flight > 0 ? "text-ink/60" : ""}>
                                {c.in_flight} in flight
                              </span>{" "}
                              ·{" "}
                              <span className={c.converted > 0 ? "text-emerald-700" : ""}>
                                {c.converted} converted
                              </span>{" "}
                              ·{" "}
                              <span className={c.lost > 0 ? "text-ink/50" : ""}>
                                {c.lost} lost
                              </span>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs font-mono text-ink/40">
                    No cohort data yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {allCohorts.length > 1 ? (
          <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.12em] text-ink/40">
            Cohorts: {allCohorts.join(" · ")}
          </div>
        ) : null}
      </section>

      <section className="mb-12">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-4">
          Decisions
        </div>
        {decisions.length === 0 ? (
          <p className="text-sm text-ink/50">No decisions yet.</p>
        ) : (
          <ol className="border border-ink/10 divide-y divide-ink/10">
            {decisions.map((d) => (
              <li
                key={d.id}
                className="px-4 py-3 grid grid-cols-[80px_60px_1fr_140px] gap-3 items-baseline"
              >
                <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/50">
                  {d.kind}
                </div>
                <div className="text-[10px] font-mono text-ink/40">
                  {d.variant_id ? `v${d.variant_id}` : "—"}
                </div>
                <div className="text-sm text-ink/80">{d.reason}</div>
                <div className="text-[10px] font-mono text-ink/40 text-right">
                  {new Date(d.at).toLocaleString()}
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
