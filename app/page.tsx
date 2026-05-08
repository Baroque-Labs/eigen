import { BetaPlot } from "./BetaPlot";

const STRIPE_LINK = "STRIPE_LINK_HERE";
const SPOTS_REMAINING = 7;
const SPOTS_TOTAL = 10;

export default function Page() {
  return (
    <main className="bg-paper text-ink">
      <Hero />
      <Problem />
      <HowItWorks />
      <MathSection />
      <VariantStrip />
      <Founding />
      <FAQ />
      <Footer />
    </main>
  );
}

/* ─────────────────────────── Hero ─────────────────────────── */

function Hero() {
  return (
    <section className="relative min-h-screen w-full bg-paper text-ink border-b border-ink">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-5">
        {/* Image — 60% on desktop, full-bleed on mobile */}
        <div className="relative md:col-span-3 border-b md:border-b-0 md:border-r border-ink overflow-hidden grain">
          {/* Using <img> rather than next/image for true full-bleed; static asset */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parliament-sunset.jpg"
            alt="Houses of Parliament, Sunset — Monet, 1903"
            className="absolute inset-0 h-full w-full object-cover"
          />
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

/* ───────────────────────── Problem (black) ───────────────────────── */

function Problem() {
  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 py-32 md:py-48 max-w-[1400px]">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 mb-10">
          The premise
        </p>
        <h2 className="font-display text-[44px] leading-[1.05] md:text-[88px] md:leading-[0.98] max-w-[18ch]">
          Traditional A/B testing wastes half your sends on the losing variant.
        </h2>
        <p className="mt-12 max-w-[55ch] text-[17px] leading-relaxed text-paper/75 md:ml-[40%]">
          You run a test. You wait for significance. You declare a winner. By
          then you&apos;ve already burned half your audience on the worse
          email — and the moment you ship the winner, the test is over. Eigen
          treats every send as evidence, every variant as a hypothesis, and
          allocates traffic in proportion to the probability that a variant
          is best. The losers die quietly. The winners compound.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────── How it works (white) ─────────────────────── */

function HowItWorks() {
  const steps: { n: string; title: string; body: string }[] = [
    {
      n: "01",
      title: "Write one email.",
      body: "Subject line, body, call-to-action. One version. Send it to Eigen and forget the spreadsheet.",
    },
    {
      n: "02",
      title: "Eigen generates variants and allocates traffic via Thompson sampling.",
      body: "An agentic loop drafts subject and body alternatives, then assigns each recipient to a variant in proportion to its posterior probability of being the best.",
    },
    {
      n: "03",
      title: "Winners compound. Losers die. New variants spawn from winners.",
      body: "When a variant pulls ahead with significance, Eigen retires the laggards, mutates the leader, and the loop continues — indefinitely.",
    },
  ];

  return (
    <section className="bg-paper text-ink border-b border-ink">
      <SectionMark />
      <div className="px-8 md:px-16 py-28 md:py-40">
        <div className="max-w-[1100px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-10">
            How it works
          </p>
          <h2 className="font-display text-[44px] md:text-[72px] leading-[0.98] max-w-[16ch]">
            Three steps. The third one never stops.
          </h2>
        </div>

        <ol className="mt-20 md:mt-28 divide-y divide-ink border-t border-ink">
          {steps.map((s) => (
            <li key={s.n} className="grid grid-cols-12 gap-6 py-10 md:py-14">
              <div className="col-span-12 md:col-span-2">
                <span className="font-mono text-[13px] tracking-[0.14em] text-ink/70">
                  {s.n}
                </span>
              </div>
              <div className="col-span-12 md:col-span-7">
                <h3 className="font-display text-[28px] md:text-[40px] leading-[1.05]">
                  {s.title}
                </h3>
              </div>
              <div className="col-span-12 md:col-span-3 md:pl-6 md:border-l md:border-ink">
                <p className="text-[15px] leading-relaxed text-ink/75">
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────────────────────── Math (black) ───────────────────────── */

function MathSection() {
  return (
    <section className="section-black relative bg-ink text-paper border-b border-paper overflow-hidden">
      <SectionMark dark />

      {/* Decorative massive λ — asymmetric (right side, bleeding past edge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none font-serif leading-none text-paper"
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
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 mb-10">
            The math
          </p>
          <h2 className="font-display text-[44px] md:text-[80px] leading-[0.98] max-w-[14ch]">
            Built on Bayesian decision theory.
          </h2>

          <p className="mt-12 max-w-[58ch] text-[17px] leading-relaxed text-paper/80">
            Each variant has a hidden conversion rate. We place a Beta(1, 1)
            prior on it, and after every send the posterior updates in closed
            form: success or failure, the parameters tick up. Beta-binomial
            conjugacy means there&apos;s no MCMC, no approximation, no
            simulation drift — just two integers per variant, updated forever.
          </p>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-paper/80">
            Eigen finds the dominant variant — the eigenvector of your
            audience&apos;s preference — and the rate at which it wins, the
            eigenvalue&nbsp;
            <span className="font-serif italic text-paper">λ</span>.
          </p>

          <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-paper/80">
            Like Monet painting Parliament nineteen times, Eigen tries
            variants until the signal emerges from the noise.
          </p>
        </div>

        {/* Fog painting — bordered inset, asymmetric, bleeds off the right edge */}
        <div className="relative mt-20 md:mt-28 -mx-8 md:mr-[-64px] md:ml-[28%] h-[380px] md:h-[560px] border-y md:border border-paper overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/parliament-fog.jpg"
            alt="Houses of Parliament, Effect of Fog — Monet, 1904"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>

        {/* Beta plot — full width, white lines on black */}
        <div className="mt-24 md:mt-32 border border-paper p-6 md:p-10 bg-ink">
          <div className="flex items-center justify-between mb-6">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">
              Posterior over θ — three variants
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60">
              Beta(1+s, 1+f)
            </span>
          </div>
          <BetaPlot className="w-full h-auto text-paper" />
        </div>

        {/* Update rule */}
        <div className="mt-16 max-w-[700px]">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-paper/60 mb-4">
            The posterior update
          </p>
          <pre className="border border-paper p-6 md:p-8 font-mono text-[15px] md:text-[18px] leading-relaxed overflow-x-auto">
{`Beta(α, β) + (s, f)  →  Beta(α + s, β + f)`}
          </pre>
          <p className="mt-4 font-mono text-[12px] text-paper/60">
            s = successes since last update, f = failures. Two integers. That&apos;s the whole state.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ─────────────────── Variant strip (black, transitional) ─────────────────── */

function VariantStrip() {
  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 py-20 md:py-28">
        <div className="border border-paper">
          <div className="grid grid-cols-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parliament-sunset.jpg"
              alt="Houses of Parliament, Sunset — Monet, 1903"
              className="block w-full h-[160px] md:h-[200px] object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parliament-fog.jpg"
              alt="Houses of Parliament, Effect of Fog — Monet, 1904"
              className="block w-full h-[160px] md:h-[200px] object-cover"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/parliament-stormy.jpg"
              alt="Houses of Parliament, Stormy Sky — Monet, 1904"
              className="block w-full h-[160px] md:h-[200px] object-cover"
            />
          </div>
        </div>

        <p className="mt-6 font-mono text-[12px] text-paper/70">
          Monet, Houses of Parliament — three of nineteen variants, 1903–1904.
        </p>
        <p className="mt-3 font-serif italic text-[22px] md:text-[30px] leading-[1.2] text-paper">
          Same subject. Different conditions. The optimizer at work.
        </p>
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
    "Founding member badge in the product",
  ];

  return (
    <section
      id="founding"
      className="bg-paper text-ink border-b border-ink"
    >
      <SectionMark />

      {/* Stormy painting — full-bleed, hairline-bordered top/bottom */}
      <div className="relative mt-8 md:mt-12 w-full h-[420px] md:h-[640px] border-y border-ink overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/parliament-stormy.jpg"
          alt="Houses of Parliament, Stormy Sky — Monet, 1904"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>

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
    {
      q: "What does the name Eigen mean?",
      a: "Eigen is named for the eigenvalue — the number that survives when everything else cancels out. That&rsquo;s what we&rsquo;re building: the email variant that wins when noise gets stripped away.",
    },
    {
      q: "When does this actually ship?",
      a: "MVP in Q3 2026 for founding members. Public beta in Q4. We&rsquo;d rather ship something correct than something fast.",
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
            Frequently, reasonably, asked.
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
            <a
              href="https://twitter.com/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-paper transition-colors"
            >
              Twitter
            </a>
            <a
              href="mailto:hello@eigen.email"
              className="hover:text-paper transition-colors"
            >
              hello@eigen.email
            </a>
            <span>© {new Date().getFullYear()} Eigen Labs</span>
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
