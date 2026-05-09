export default function DomainsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="font-serif text-3xl mb-8">Domains</h1>
      <div className="border border-ink/10 rounded-lg p-12 text-center text-ink/60">
        <p className="text-sm">
          Verify a sending domain to unlock campaigns. Eigen surfaces the DKIM,
          SPF, and DMARC records you need to add to DNS.
        </p>
      </div>
    </div>
  );
}
