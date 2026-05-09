import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "You're in — Eigen",
  description: "Founding spot confirmed.",
};

export default function ClaimSuccessPage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <section className="px-8 md:px-16 py-20 md:py-28 border-b border-ink">
        <div className="max-w-2xl mx-auto">
          <a
            href="/"
            className="inline-flex items-baseline gap-3 hover:opacity-70 transition-opacity"
          >
            <span className="font-serif text-3xl leading-none">λ</span>
            <span className="font-serif text-2xl leading-none tracking-tight">
              Eigen
            </span>
          </a>

          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mt-16">
            Confirmed
          </p>
          <h1 className="font-display text-[56px] md:text-[80px] leading-[0.95] mt-4">
            You&rsquo;re in.
          </h1>
          <p className="mt-8 text-[19px] leading-relaxed text-ink/80 max-w-xl">
            Your founding spot is locked. Stripe will email you a receipt
            shortly. We&rsquo;ll be in touch within a day to get you set up
            and onto the founders&rsquo; channel.
          </p>

          <div className="mt-12">
            <a
              href="/"
              className="inline-block bg-ink text-paper px-7 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors"
            >
              Back to Eigen
            </a>
          </div>

          <div className="mt-24 pt-8 border-t border-ink font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">
            Lifetime 50% discount · Direct line to the founder · First access
            when MVP ships
          </div>
        </div>
      </section>
    </main>
  );
}
