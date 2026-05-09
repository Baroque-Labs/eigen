import Link from "next/link";
import { listDomains } from "@/app/_lib/domains/queries";
import { AddDomainForm } from "./AddDomainForm";

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  verified: "Verified",
  failed: "Failed",
};

export default async function DomainsPage() {
  const rows = await listDomains();

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl mb-2">Domains</h1>
      <p className="text-sm text-ink/60 mb-8">
        Verify a sending domain to unlock campaigns. Eigen surfaces the DKIM,
        SPF, and DMARC records you need to add to DNS.
      </p>

      <section className="border border-ink/10 rounded-lg p-6 mb-8">
        <h2 className="text-xs uppercase tracking-wider text-ink/50 mb-3">
          Add a domain
        </h2>
        <AddDomainForm />
      </section>

      {rows.length === 0 ? null : (
        <ul className="border border-ink/10 rounded-lg divide-y divide-ink/10">
          {rows.map((d) => (
            <li key={d.id}>
              <Link
                href={`/domains/${d.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-ink/5"
              >
                <div className="text-sm font-mono">{d.hostname}</div>
                <div
                  className={`text-xs ${
                    d.status === "verified"
                      ? "text-emerald-700"
                      : d.status === "failed"
                        ? "text-red-700"
                        : "text-ink/50"
                  }`}
                >
                  {STATUS_LABEL[d.status] ?? d.status}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
