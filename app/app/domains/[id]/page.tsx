import Link from "next/link";
import { notFound } from "next/navigation";
import { getDomain } from "@/app/_lib/domains/queries";
import { recheckDomainAction } from "@/app/_lib/domains/actions";
import { syncDomainFromResend } from "@/app/_lib/domains/sync";

type Params = Promise<{ id: string }>;

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "text-ink/60 bg-ink/5" },
  verified: { label: "Verified", className: "text-emerald-700 bg-emerald-50" },
  failed: { label: "Failed", className: "text-red-700 bg-red-50" },
};

export default async function DomainDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const domain = await getDomain(id);
  if (!domain) notFound();

  // Pull fresh DNS records + status on every load. syncDomainFromResend
  // updates our DB silently if Resend reports a new status, so the
  // badge below reflects the latest pull. We don't trigger a re-verify
  // here — that's what the "Check verification" button is for.
  const fresh = await syncDomainFromResend(id);
  const status = fresh.status;
  const records = fresh.records;
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.pending;

  return (
    <div className="max-w-3xl">
      <Link href="/domains" className="text-xs text-ink/50 hover:text-ink/80">
        ← Domains
      </Link>
      <div className="flex items-baseline justify-between mt-2 mb-1">
        <h1 className="font-serif text-3xl font-mono">{domain.hostname}</h1>
        <span className={`text-xs px-2 py-1 rounded ${badge.className}`}>
          {badge.label}
        </span>
      </div>
      <p className="text-xs font-mono text-ink/40 mb-8">{domain.id}</p>

      {status === "verified" ? (
        <section className="border border-emerald-200 bg-emerald-50/50 rounded-lg p-6 text-sm">
          DKIM, SPF, and DMARC look good. You can use this domain as the
          sender for campaigns.
        </section>
      ) : (
        <section className="border border-ink/10 rounded-lg p-6 mb-6">
          <h2 className="text-xs uppercase tracking-wider text-ink/50 mb-3">
            DNS records
          </h2>
          <p className="text-sm text-ink/70 mb-4">
            Add these to your DNS provider. Verification typically takes a few
            minutes after the records propagate.
          </p>
          {records.length === 0 ? (
            <p className="text-sm text-ink/50">No records returned yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead>
                  <tr className="text-ink/50 text-left border-b border-ink/10">
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Value</th>
                    <th className="py-2 pr-4">TTL</th>
                    <th className="py-2 pr-4">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r, i) => (
                    <tr key={i} className="border-b border-ink/5">
                      <td className="py-2 pr-4">{r.type}</td>
                      <td className="py-2 pr-4 break-all">{r.name}</td>
                      <td className="py-2 pr-4 break-all">{r.value}</td>
                      <td className="py-2 pr-4">{r.ttl ?? "auto"}</td>
                      <td className="py-2 pr-4">{r.priority ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <form action={recheckDomainAction} className="mt-6">
            <input type="hidden" name="id" value={domain.id} />
            <button
              type="submit"
              className="px-3 py-1.5 text-sm rounded bg-ink text-paper hover:bg-ink/90"
            >
              Check verification
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
