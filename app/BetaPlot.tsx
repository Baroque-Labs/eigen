// Static SVG of three Beta posteriors plotted on a shared y-axis.
// Computed at module load — no runtime cost beyond first render.

const lanczosG = 7;
const lanczosC = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028,
  771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

function lgamma(x: number): number {
  if (x < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x);
  }
  x -= 1;
  let a = lanczosC[0];
  const t = x + lanczosG + 0.5;
  for (let i = 1; i < lanczosC.length; i++) a += lanczosC[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}

function logBetaPdf(x: number, alpha: number, beta: number): number {
  if (x <= 0 || x >= 1) return -Infinity;
  return (
    (alpha - 1) * Math.log(x) +
    (beta - 1) * Math.log(1 - x) -
    (lgamma(alpha) + lgamma(beta) - lgamma(alpha + beta))
  );
}

type Variant = { label: string; successes: number; trials: number };

const variants: Variant[] = [
  { label: "Variant A: 47/200", successes: 47, trials: 200 },
  { label: "Variant B: 89/210", successes: 89, trials: 210 },
  { label: "Variant C: 12/180", successes: 12, trials: 180 },
];

// Plot domain: 0 → 0.6 covers all three peaks comfortably
const X_MIN = 0;
const X_MAX = 0.6;
const SAMPLES = 240;

const VIEW_W = 1000;
const VIEW_H = 360;
const PAD_L = 60;
const PAD_R = 40;
const PAD_T = 40;
const PAD_B = 60;

const plotW = VIEW_W - PAD_L - PAD_R;
const plotH = VIEW_H - PAD_T - PAD_B;

type Curve = {
  variant: Variant;
  alpha: number;
  beta: number;
  points: { x: number; y: number; px: number; py: number }[];
  peakX: number;
  peakY: number;
};

const curves: Curve[] = variants.map((v) => {
  const alpha = 1 + v.successes;
  const beta = 1 + (v.trials - v.successes);
  const points: Curve["points"] = [];
  let peakX = 0;
  let peakY = -Infinity;
  for (let i = 0; i <= SAMPLES; i++) {
    const x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLES;
    const y = Math.exp(logBetaPdf(x, alpha, beta));
    if (y > peakY) {
      peakY = y;
      peakX = x;
    }
    points.push({ x, y, px: 0, py: 0 });
  }
  return { variant: v, alpha, beta, points, peakX, peakY };
});

// Shared y-scale across all curves so "narrowing = taller" reads truthfully
const yMaxGlobal = Math.max(...curves.map((c) => c.peakY)) * 1.06;

function project(x: number, y: number) {
  const px = PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const py = PAD_T + plotH - (y / yMaxGlobal) * plotH;
  return { px, py };
}

for (const c of curves) {
  for (const p of c.points) {
    const { px, py } = project(p.x, p.y);
    p.px = px;
    p.py = py;
  }
}

function pathFor(curve: Curve): string {
  const head = curve.points[0];
  let d = `M ${head.px.toFixed(2)} ${head.py.toFixed(2)}`;
  for (let i = 1; i < curve.points.length; i++) {
    const p = curve.points[i];
    d += ` L ${p.px.toFixed(2)} ${p.py.toFixed(2)}`;
  }
  return d;
}

const xTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
const baselineY = PAD_T + plotH;

export function BetaPlot({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      className={className}
      role="img"
      aria-label="Three Beta posterior distributions narrowing as data accumulates"
    >
      {/* baseline */}
      <line
        x1={PAD_L}
        x2={VIEW_W - PAD_R}
        y1={baselineY}
        y2={baselineY}
        stroke="currentColor"
        strokeWidth={1}
      />
      {/* x ticks + labels */}
      {xTicks.map((t) => {
        const { px } = project(t, 0);
        return (
          <g key={t}>
            <line
              x1={px}
              x2={px}
              y1={baselineY}
              y2={baselineY + 6}
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={px}
              y={baselineY + 24}
              fontSize={12}
              textAnchor="middle"
              fill="currentColor"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {t.toFixed(1)}
            </text>
          </g>
        );
      })}
      {/* axis label */}
      <text
        x={PAD_L + plotW / 2}
        y={VIEW_H - 10}
        fontSize={12}
        textAnchor="middle"
        fill="currentColor"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        conversion rate θ
      </text>

      {/* curves */}
      {curves.map((c, i) => {
        const dash = i === 0 ? "0" : i === 1 ? "0" : "4 4";
        const strokeWidth = i === 1 ? 1.75 : 1.25;
        return (
          <path
            key={c.variant.label}
            d={pathFor(c)}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={dash}
            strokeLinejoin="round"
          />
        );
      })}

      {/* curve labels — anchored to each peak */}
      {curves.map((c) => {
        const peak = project(c.peakX, c.peakY);
        return (
          <g key={`${c.variant.label}-label`}>
            <line
              x1={peak.px}
              x2={peak.px}
              y1={peak.py - 6}
              y2={peak.py - 18}
              stroke="currentColor"
              strokeWidth={1}
            />
            <text
              x={peak.px}
              y={peak.py - 24}
              fontSize={12}
              textAnchor="middle"
              fill="currentColor"
              style={{ fontFamily: "var(--font-mono)" }}
            >
              {c.variant.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
