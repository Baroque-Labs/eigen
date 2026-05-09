import { BetaPlot } from "@/app/beta-plot/BetaPlot";
import { MonoLabel } from "@/app/_components/MonoLabel";
import { SectionMark } from "./SectionMark";

export function MathSection() {
  return (
    <section className="relative bg-paper text-ink border-b border-ink overflow-hidden">
      <SectionMark />

      {/* Decorative massive λ — asymmetric (right side, bleeding past edge) */}
      <div
        aria-hidden
        className="pointer-events-none absolute select-none font-serif leading-none text-ink hidden md:block"
        style={{
          right: "-40px",
          top: "60px",
          fontSize: "400px",
        }}
      >
        λ
      </div>

      <div className="relative px-8 md:px-16 pt-10 md:pt-16 pb-20 md:pb-40">
        <div className="max-w-[820px]">
          <MonoLabel className="mb-10 block">The math</MonoLabel>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0 mb-6">
            <MonoLabel>Posterior over θ — three variants</MonoLabel>
            <MonoLabel>Beta(1+s, 1+f)</MonoLabel>
          </div>
          <BetaPlot className="w-full h-auto text-ink" />
        </div>

        {/* Update rule */}
        <div className="mt-16 max-w-[700px]">
          <MonoLabel className="mb-4 block">The posterior update</MonoLabel>
          <pre className="border border-ink p-6 md:p-8 font-mono text-[15px] md:text-[18px] leading-relaxed overflow-x-auto">
            {`Beta(α, β) + (s, f)  →  Beta(α + s, β + f)`}
          </pre>
          <p className="mt-4 font-mono text-[12px] text-ink/60">
            s = successes since last update, f = failures. Two integers.
            That&apos;s the whole state.
          </p>

          <a
            href="https://docs.google.com/document/d/1jrFn9ftcccNQA9teZJMusLnvePW1vgsdyaopjQkYDvo/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-block font-mono text-[12px] uppercase tracking-[0.18em] text-ink/70 hover:text-ink underline underline-offset-4 decoration-ink/40 hover:decoration-ink transition-colors"
          >
            Read the methodology paper →
          </a>
        </div>
      </div>
    </section>
  );
}
