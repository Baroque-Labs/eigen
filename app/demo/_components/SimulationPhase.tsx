import { AllocationChart } from "../_charts/AllocationChart";
import { ChartCard } from "../_charts/ChartCard";
import { ComparisonChart } from "../_charts/ComparisonChart";
import { ConversionRatesChart } from "../_charts/ConversionRatesChart";
import { PosteriorDistributionsChart } from "../_charts/PosteriorDistributionsChart";
import { FLASH_DURATION_MS, MAX_VARIANTS } from "../_constants";
import type { SimState } from "../_types";
import { DotPulse } from "./GeneratingPhase";
import { StatsTable } from "./StatsTable";
import { TotalsTable } from "./TotalsTable";
import { VariantCard } from "./VariantCard";
import { EigenUniformLegend, VariantLegend } from "./VariantLegend";

type Props = {
  sim: SimState;
  speed: number;
  setSpeed: (n: number) => void;
  isPaused: boolean;
  setIsPaused: (b: boolean) => void;
  showTrueRates: boolean;
  setShowTrueRates: (b: boolean) => void;
  onReset: () => void;
  errorMsg: string | null;
};

export function SimulationPhase({
  sim,
  speed,
  setSpeed,
  isPaused,
  setIsPaused,
  showTrueRates,
  setShowTrueRates,
  onReset,
  errorMsg,
}: Props) {
  // Per the brief: dead variants stay visible (faded), they aren't removed.
  const orderedVariants = sim.variants.slice().sort((a, b) => a.index - b.index);

  const eigenRate =
    sim.eigenImpressions > 0 ? sim.eigenConversions / sim.eigenImpressions : 0;
  const uniformRate =
    sim.uniformImpressions > 0
      ? sim.uniformConversions / sim.uniformImpressions
      : 0;
  // Arithmetic difference in percentage points (Eigen − Uniform).
  const advantagePp = (eigenRate - uniformRate) * 100;

  return (
    <section className="relative px-6 md:px-10 py-10 md:py-12">
      {sim.generationFlash !== null && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-30 border border-ink bg-paper px-4 py-2 font-mono text-[12px] uppercase tracking-[0.18em] gen-flash">
          Generation {sim.generationFlash}
        </div>
      )}

      {/* Pending replacement banner — only during the API call, not the fade */}
      {sim.pendingReplacement &&
        !sim.variants.some((v) => v.status === "dying") && (
          <div className="border border-ink bg-paper px-4 py-3 mb-6 flex items-center gap-3">
            <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink">
              Generating new variants
            </span>
            <DotPulse />
          </div>
        )}

      {/* Test-complete banner — fires when the next generation would mint variant #13 */}
      {sim.ended && (
        <div className="border border-ink bg-ink text-paper px-5 py-4 mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/70">
              Test complete
            </span>
            <span className="font-serif text-[22px] leading-tight mt-1">
              {MAX_VARIANTS} variants explored. The loop has paused.
            </span>
          </div>
          <button
            onClick={onReset}
            className="border border-paper px-3 py-1 font-mono text-[11px] uppercase tracking-[0.14em] hover:bg-paper hover:text-ink transition-colors"
          >
            reset
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="font-mono text-[11px] text-ink/60 mb-4">{errorMsg}</div>
      )}

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mb-8 font-mono text-[11px] uppercase tracking-[0.14em]">
        <button
          onClick={() => setShowTrueRates(!showTrueRates)}
          className="flex items-center gap-2"
        >
          <span
            className={`inline-block w-3 h-3 border border-ink ${
              showTrueRates ? "bg-ink" : "bg-paper"
            }`}
          />
          show true rates
        </button>

        <div className="flex items-center gap-3">
          <span className="text-ink/70">
            speed: {speed} trials/sec
          </span>
          <input
            type="range"
            min={1}
            max={50}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value, 10))}
            className="accent-black w-32"
          />
        </div>

        <button
          onClick={() => setIsPaused(!isPaused)}
          className="border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
        >
          {isPaused ? "resume" : "pause"}
        </button>

        <button
          onClick={onReset}
          className="border border-ink px-3 py-1 hover:bg-ink hover:text-paper transition-colors"
        >
          reset
        </button>

        <span className="text-ink/60 ml-auto">
          generation {sim.generation} · trial {sim.trial}
        </span>
      </div>

      {/* Variants strip — single horizontal row, scrolls if many */}
      <div className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Variants
      </div>
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-6 px-6 md:-mx-10 md:px-10 items-stretch">
        {orderedVariants.map((v) => (
          <VariantCard key={v.id} variant={v} />
        ))}
      </div>

      {/* Totals table */}
      <div className="mt-10 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Totals
      </div>
      <TotalsTable
        eigenImpressions={sim.eigenImpressions}
        eigenConversions={sim.eigenConversions}
        eigenRate={eigenRate}
        uniformImpressions={sim.uniformImpressions}
        uniformConversions={sim.uniformConversions}
        uniformRate={uniformRate}
        advantagePp={advantagePp}
      />

      {/* Per-variant stats table */}
      <div className="mt-8 mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink/60">
        Per-variant metrics
      </div>
      <StatsTable variants={orderedVariants} showTrueRate={showTrueRates} />

      {/* 2 × 2 chart grid */}
      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard title="Conversion rate per variant">
          <ConversionRatesChart sim={sim} variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>

        <ChartCard title="Allocation over time">
          <AllocationChart sim={sim} variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>

        <ChartCard title="Aggregate conversion rate" prominent>
          <ComparisonChart sim={sim} />
          <EigenUniformLegend />
          <div className="mt-3 font-mono text-[12px] text-ink/80">
            Eigen converted{" "}
            <span className="text-ink">
              {advantagePp >= 0 ? "+" : "−"}
              {Math.abs(advantagePp).toFixed(2)} pp
            </span>{" "}
            {advantagePp >= 0 ? "higher" : "lower"} than uniform allocation
            over the same impressions.
          </div>
        </ChartCard>

        <ChartCard title="Posterior conversion rate distributions">
          <PosteriorDistributionsChart variants={orderedVariants} />
          <VariantLegend variants={orderedVariants} />
        </ChartCard>
      </div>

      <style>{`
        @keyframes gen-flash-anim {
          0%   { opacity: 0; transform: translate(-50%, -8px); }
          15%  { opacity: 1; transform: translate(-50%, 0); }
          85%  { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -8px); }
        }
        .gen-flash {
          animation: gen-flash-anim ${FLASH_DURATION_MS}ms ease-out forwards;
        }
        @keyframes variant-slide-in {
          0%   { opacity: 0; transform: translateY(12px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
