import { BetaPlot } from "./BetaPlot";
import { AllocatorDiagram } from "./Allocator";

const STRIPE_LINK = "STRIPE_LINK_HERE";
const SPOTS_REMAINING = 7;
const SPOTS_TOTAL = 10;

export default function Page() {
  return (
    <main className="bg-paper text-ink">
      <Hero />
      <Allocator />
      <Founding />
      <FAQ />
      <MathSection />
      <Footer />
    </main>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen w-full bg-paper text-ink border-b border-ink">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-5">
        {/* Image — 60% on desktop, full-bleed on mobile.
            Three Monet "Houses of Parliament" paintings crossfade on a 24s loop. */}
        <div className="relative md:col-span-3 border-b md:border-b-0 md:border-r border-ink overflow-hidden grain bg-ink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parliament-sunset.jpg"
            alt="Houses of Parliament, Sunset — Monet, 1903"
            className="monet-1 absolute inset-0 h-full w-full object-cover"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parliament-fog.jpg"
            alt="Houses of Parliament, Effect of Fog — Monet, 1904"
            className="monet-2 absolute inset-0 h-full w-full object-cover"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parliament-stormy.jpg"
            alt="Houses of Parliament, Stormy Sky — Monet, 1904"
            className="monet-3 absolute inset-0 h-full w-full object-cover"
          />

          {/* Reference / image credit — overlaid on the image */}
          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-paper/75">
            Claude Monet — Houses of Parliament, 1903–1904
          </div>
        </div>

        {/* Content — 40% */}
        <div className="md:col-span-2 flex flex-col justify-between p-8 md:p-12">
          {/* Top-left wordmark */}
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl leading-none">λ</span>
            <span className="font-serif text-2xl leading-none tracking-tight">
              Eigen
            </span>
          </div>

          {/* Centered headline block */}
          <div className="flex-1 flex flex-col justify-center max-w-xl py-12">
            <h1 className="font-display text-[64px] leading-[0.95] md:text-[88px] md:leading-[0.92]">
              Email that optimizes itself.
            </h1>
            <p className="mt-8 text-[19px] leading-relaxed text-ink/80 max-w-md">
              Eigen runs Thompson sampling over your variants in production —
              killing losers, compounding winners, and spawning new variants
              the moment a test reaches significance. Continuously. Bayesianly.
            </p>

            <div className="mt-10 flex flex-col items-start gap-3">
              <a
                href="#founding"
                className="inline-block bg-ink text-paper px-6 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors"
              >
                Claim a founding spot — $100
              </a>
              <span className="font-mono text-[12px] text-ink/70">
                {SPOTS_REMAINING} of {SPOTS_TOTAL} spots remaining
              </span>
            </div>
          </div>

          {/* Bottom-right meta — pure typographic restraint */}
          <div className="flex items-end justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">
            <span>est. 2026</span>
            <span>v0 · founding round</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Allocator (black) ───────────────────────── */

function Allocator() {
  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 py-28 md:py-40">
        <div className="max-w-[1100px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 mb-10">
            Allocation + generation
          </p>
          <h2 className="font-display text-[44px] md:text-[80px] leading-[0.98] max-w-[14ch]">
            The optimizer, in motion.
          </h2>
        </div>

        <div className="mt-16 md:mt-24">
          <AllocatorDiagram />
        </div>

        <p className="mt-8 max-w-[68ch] font-mono text-[12px] leading-relaxed text-paper/60">
          Each send is evidence. Posteriors update. Allocation tracks
          Pr(variant is best). Winners compound, losers retire, and new
          variants spawn from the leader — automatically.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────────── Math (white) ───────────────────────── */

function MathSection() {
  return (
    <section className="relative bg-paper text-ink border-b border-ink overflow-hidden">
      <SectionMark />

      {/* Decorative massive λ — asymmetric (right side, bleeding past edge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none font-serif leading-none text-ink"
        style={{
          right: "-40px",
          top: "60px",
          fontSize: "400px",
        }}
      >
        λ
      </div>

      <div className="relative px-8 md:px-16 py-28 md:py-40">
        <div className="max-w-[820px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-10">
            The math
          </p>
          <h2 className="font-display text-[44px] md:text-[80px] leading-[0.98] max-w-[14ch]">
            Built on Bayesian decision theory.
          </h2>

          <p className="mt-12 max-w-[58ch] text-[17px] leading-relaxed text-ink/80">
            Each variant has a hidden conversion rate. We place a Beta(1, 1)
            prior on it, and after every send the posterior updates in closed
            form: success or failure, the parameters tick up. Beta-binomial
            conjugacy means there&apos;s no MCMC, no approximation, no
            simulation drift — just two integers per variant, updated forever.
          </p>
        </div>

        {/* Beta plot — black lines on white */}
        <div className="mt-20 md:mt-28 border border-ink p-6 md:p-10 bg-paper">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
              Posterior over θ — three variants
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
              Beta(1+s, 1+f)
            </span>
          </div>
          <BetaPlot className="w-full h-auto text-ink" />
        </div>

        {/* Update rule */}
        <div className="mt-16 max-w-[700px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-4">
            The posterior update
          </p>
          <pre className="border border-ink p-6 md:p-8 font-mono text-[15px] md:text-[18px] leading-relaxed overflow-x-auto">
{`Beta(α, β) + (s, f)  →  Beta(α + s, β + f)`}
          </pre>
          <p className="mt-4 font-mono text-[12px] text-ink/60">
            s = successes since last update, f = failures. Two integers. That&apos;s the whole state.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ────────────────────── Founding members (white) ────────────────────── */

function Founding() {
  const benefits = [
    "Lifetime 50% discount on whatever pricing ends up being",
    "Direct Slack/email line to the founder",
    "First access when MVP ships",
  ];

  return (
    <section
      id="founding"
      className="bg-paper text-ink border-b border-ink"
    >
      <SectionMark />

      <div className="px-8 md:px-16 py-28 md:py-40">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-10">
              Founding round
            </p>
            <h2 className="font-display text-[48px] md:text-[96px] leading-[0.95]">
              10 founding spots.
              <br />
              <span className="text-ink/40">$100 each.</span>
            </h2>
          </div>

          <div className="col-span-12 md:col-span-5 md:pt-8">
            <ul className="border-t border-ink">
              {benefits.map((b) => (
                <li
                  key={b}
                  className="border-b border-ink py-5 flex gap-4 items-start"
                >
                  <span className="font-serif text-[20px] leading-none text-ink pt-1 w-6 shrink-0">
                    •
                  </span>
                  <span className="text-[16px] leading-snug">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-start gap-3">
              <a
                href={STRIPE_LINK}
                className="inline-block bg-ink text-paper px-7 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors"
              >
                Claim a founding spot — $100
              </a>
              <span className="font-mono text-[12px] text-ink/70">
                {SPOTS_REMAINING} of {SPOTS_TOTAL} spots remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── FAQ (black) ───────────────────────── */

function FAQ() {
  const qa: { q: string; a: string }[] = [
    {
      q: "What if I don't have an email list yet?",
      a: "Eigen is built for senders with at least a few thousand subscribers — that&rsquo;s the volume needed for posteriors to separate quickly. If you&rsquo;re smaller, the math still works, it&rsquo;ll just take longer to converge. Reach out and we can talk through it.",
    },
    {
      q: "How is this different from Mailchimp's A/B testing?",
      a: "Mailchimp picks a winner once, then sends the winner to everyone. Eigen never stops testing — every send is both an experiment and a delivery, and traffic is allocated continuously based on each variant&rsquo;s posterior probability of being best. New variants spawn automatically when winners emerge.",
    },
    {
      q: "What happens after the 10 spots fill?",
      a: "The founding round closes and the next tier prices significantly higher. Founding members keep their 50% lifetime discount regardless.",
    },
    {
      q: "What's Thompson sampling?",
      a: "A bandit algorithm: at each decision, sample one conversion rate from each variant&rsquo;s posterior, pick the variant with the highest sample, send. It naturally explores uncertain variants and exploits confident ones — no manual hyperparameters.",
    },
  ];

  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 py-28 md:py-40">
        <div className="max-w-[1100px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 mb-10">
            Questions
          </p>
          <h2 className="font-display text-[44px] md:text-[72px] leading-[0.98] max-w-[18ch]">
            Frequently asked.
          </h2>
        </div>

        <div className="mt-16 md:mt-24 max-w-[900px] border-t border-paper">
          {qa.map((item, i) => (
            <details
              key={i}
              className="group border-b border-paper py-6 md:py-8"
            >
              <summary className="flex items-baseline gap-6 md:gap-10">
                <span className="font-mono text-[12px] text-paper/60 w-8 shrink-0 pt-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[24px] md:text-[34px] leading-[1.15] flex-1">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="font-serif text-[28px] leading-none transition-transform group-open:rotate-45 origin-center"
                >
                  +
                </span>
              </summary>
              <div className="mt-5 md:ml-[80px] max-w-[60ch]">
                <p
                  className="text-[16px] leading-relaxed text-paper/80"
                  dangerouslySetInnerHTML={{ __html: item.a }}
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="section-black bg-ink text-paper">
      <div className="px-8 md:px-16 py-16">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-10">
          <div className="flex items-baseline gap-3">
            <span className="font-serif text-3xl leading-none">λ</span>
            <span className="font-serif text-2xl leading-none tracking-tight">
              Eigen
            </span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end gap-6 md:gap-12 font-mono text-[12px] uppercase tracking-[0.14em] text-paper/70">
            <span>© {new Date().getFullYear()} Baroque Labs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────── Shared section mark ─────────────────────── */

function SectionMark({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={`px-8 md:px-16 pt-8 ${
        dark ? "text-paper" : "text-ink"
      }`}
    >
      <span className="font-serif text-[32px] leading-none">λ</span>
    </div>
  );
}
