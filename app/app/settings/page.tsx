import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { apiKeys } from "@/db/schema";
import { requireOrg } from "@/app/_lib/auth/org";
import { getVerifiedDomain } from "@/app/_lib/domains/queries";

export default async function SettingsPage() {
  const { org } = await requireOrg();
  const db = getDb();
  const keys = await db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      createdAt: apiKeys.createdAt,
      keyHash: apiKeys.keyHash,
    })
    .from(apiKeys)
    .where(eq(apiKeys.orgId, org.id));
  const verifiedDomain = await getVerifiedDomain();

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-4xl tracking-tight mb-8">Settings</h1>

      <section className="mb-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-3">
          Workspace
        </div>
        <div className="border border-ink/10 p-4">
          <div className="font-serif text-2xl">{org.name}</div>
          <div className="text-[10px] font-mono text-ink/40 mt-1">{org.id}</div>
        </div>
      </section>

      <section className="mb-10">
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-3">
          Sending domain
        </div>
        <div className="border border-ink/10 p-4">
          {verifiedDomain ? (
            <>
              <div className="font-mono text-sm">{verifiedDomain.hostname}</div>
              <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/50 mt-1">
                VERIFIED
              </div>
            </>
          ) : (
            <div className="text-sm text-ink/60">
              No verified domain.{" "}
              <a href="/domains" className="underline hover:text-ink">
                Add one
              </a>
              .
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-ink/50 mb-3">
          Backend API keys
        </div>
        {keys.length === 0 ? (
          <div className="border border-ink/10 p-4 text-sm text-ink/60">
            No backend keys yet. Visit the campaigns page to provision one.
          </div>
        ) : (
          <ul className="border border-ink/10 divide-y divide-ink/10">
            {keys.map((k) => (
              <li
                key={k.id}
                className="p-4 grid grid-cols-[1fr_1fr_140px] gap-3 items-baseline"
              >
                <div className="text-sm">{k.label ?? "(unlabeled)"}</div>
                <div className="text-[10px] font-mono text-ink/40 truncate">
                  hash: {k.keyHash.slice(0, 16)}…
                </div>
                <div className="text-[10px] font-mono text-ink/40 text-right">
                  {new Date(k.createdAt).toLocaleDateString()}
                </div>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-ink/50 mt-3">
          Keys are minted by the backend and stored hashed. Raw values are only
          shown once on creation.
        </p>
      </section>
    </div>
  );
}
