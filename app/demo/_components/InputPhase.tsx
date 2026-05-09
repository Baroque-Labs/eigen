import { MonoLabel } from "@/app/_components/MonoLabel";

type Props = {
  inputEmail: string;
  setInputEmail: (s: string) => void;
  minRatePct: number;
  setMinRatePct: (n: number) => void;
  maxRatePct: number;
  setMaxRatePct: (n: number) => void;
  onStart: () => void;
  errorMsg: string | null;
};

export function InputPhase({
  inputEmail,
  setInputEmail,
  minRatePct,
  setMinRatePct,
  maxRatePct,
  setMaxRatePct,
  onStart,
  errorMsg,
}: Props) {
  const rangeValid = minRatePct < maxRatePct;
  return (
    <section className="px-6 md:px-10 py-16 md:py-24">
      <div className="max-w-[800px] mx-auto">
        <MonoLabel className="mb-8 block">Live demo</MonoLabel>
        <h1 className="font-display text-[44px] md:text-[72px] leading-[0.98] tracking-tight">
          Watch Eigen optimize a real email.
        </h1>
        <p className="mt-8 text-[17px] leading-relaxed text-ink/80 max-w-[58ch]">
          Paste a marketing email below. Eigen will generate three variants
          along different axes, assign each a hidden conversion rate, and run
          Thompson sampling against all four — live, in your browser. Watch
          allocation track the posteriors, losers retire, and new variants
          spawn from the leader.
        </p>

        <div className="mt-12">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-3 block">
            Your email
          </label>
          <textarea
            value={inputEmail}
            onChange={(e) => setInputEmail(e.target.value)}
            rows={12}
            className="w-full border border-ink bg-paper p-5 font-mono text-[13px] leading-relaxed text-ink resize-y focus:outline-none placeholder:text-ink/40"
            placeholder="Paste your email here. Subject line on the first line, body below."
            spellCheck={false}
          />
        </div>

        <div className="mt-10">
          <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60 mb-3 block">
            Conversion rate range
          </label>
          <p className="text-[13px] text-ink/70 leading-relaxed max-w-[58ch] mb-4">
            Each variant&rsquo;s hidden true conversion rate is sampled
            uniformly from this range. The baseline is set to the mean of
            the three sampled rates, so at least one variant always beats
            the baseline.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[12px] text-ink/80">
            <label className="inline-flex items-center gap-2">
              <span className="uppercase tracking-[0.14em] text-ink/60">min</span>
              <input
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={minRatePct}
                onChange={(e) =>
                  setMinRatePct(parseFloat(e.target.value || "0"))
                }
                className="w-20 border border-ink bg-paper px-2 py-1 font-mono text-[13px] tabular-nums focus:outline-none"
              />
              <span className="text-ink/60">%</span>
            </label>
            <span className="text-ink/40">to</span>
            <label className="inline-flex items-center gap-2">
              <span className="uppercase tracking-[0.14em] text-ink/60">max</span>
              <input
                type="number"
                step={0.5}
                min={0}
                max={100}
                value={maxRatePct}
                onChange={(e) =>
                  setMaxRatePct(parseFloat(e.target.value || "0"))
                }
                className="w-20 border border-ink bg-paper px-2 py-1 font-mono text-[13px] tabular-nums focus:outline-none"
              />
              <span className="text-ink/60">%</span>
            </label>
            {!rangeValid && (
              <span className="text-ink/60">min must be below max</span>
            )}
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start gap-3">
          <button
            onClick={onStart}
            disabled={!inputEmail.trim() || !rangeValid}
            className="bg-ink text-paper px-7 py-4 text-[15px] font-medium tracking-tight rounded-[4px] hover:bg-ink/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Run Eigen on this →
          </button>
          {errorMsg && (
            <span className="font-mono text-[11px] text-ink/60">{errorMsg}</span>
          )}
        </div>
      </div>
    </section>
  );
}
