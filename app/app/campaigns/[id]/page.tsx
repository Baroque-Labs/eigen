type Params = Promise<{ id: string }>;

export default async function CampaignDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl mb-2">Campaign</h1>
      <p className="text-xs font-mono text-ink/50 mb-8">{id}</p>
      <div className="border border-ink/10 rounded-lg p-12 text-center text-ink/60">
        <p className="text-sm">
          Posterior charts, variant table, and approval queue land here once the
          send pipeline is wired up.
        </p>
      </div>
    </div>
  );
}
