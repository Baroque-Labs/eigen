import type { RatePoint, SimState } from "../_types";

export function ComparisonChart({ sim }: { sim: SimState }) {
  const W = 520;
  const H = 240;
  const PAD_L = 40;
  const PAD_R = 80;
  const PAD_T = 14;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const trial = Math.max(sim.trial, 1);
  const eigenH = sim.eigenHistory;
  const uniformH = sim.uniformHistory;

  // Auto y-scale
  let yMax = 0.05;
  let yMin = Infinity;
  for (const p of eigenH) {
    if (p.rate > yMax) yMax = p.rate;
    if (p.rate < yMin) yMin = p.rate;
  }
  for (const p of uniformH) {
    if (p.rate > yMax) yMax = p.rate;
    if (p.rate < yMin) yMin = p.rate;
  }
  if (!isFinite(yMin)) yMin = 0;
  yMax = yMax * 1.15;
  yMin = Math.max(0, yMin * 0.85);
  if (yMax - yMin < 0.02) yMax = yMin + 0.02;

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (y: number) =>
    PAD_T + plotH - ((y - yMin) / (yMax - yMin)) * plotH;

  const buildPath = (pts: RatePoint[]) => {
    if (pts.length < 2) return "";
    return pts
      .map(
        (p, i) =>
          `${i === 0 ? "M" : "L"} ${xPx(p.trial).toFixed(1)} ${yPx(p.rate).toFixed(1)}`,
      )
      .join(" ");
  };

  const eigenLast = eigenH[eigenH.length - 1];
  const uniformLast = uniformH[uniformH.length - 1];

  const eigenRate = eigenLast?.rate ?? 0;
  const uniformRate = uniformLast?.rate ?? 0;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + plotH} y2={PAD_T + plotH} stroke="#000" strokeWidth={1} />
      <line x1={PAD_L} x2={PAD_L} y1={PAD_T} y2={PAD_T + plotH} stroke="#000" strokeWidth={1} />

      <text x={PAD_L - 4} y={PAD_T + 4} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {(yMax * 100).toFixed(1)}%
      </text>
      <text x={PAD_L - 4} y={PAD_T + plotH} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {(yMin * 100).toFixed(1)}%
      </text>

      <text x={PAD_L} y={PAD_T + plotH + 16} fontSize={10} textAnchor="start" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        0
      </text>
      <text x={W - PAD_R} y={PAD_T + plotH + 16} fontSize={10} textAnchor="end" fill="#000" style={{ fontFamily: "var(--font-mono)" }}>
        {sim.trial}
      </text>

      {/* uniform line — dashed, 1px */}
      <path d={buildPath(uniformH)} fill="none" stroke="#000" strokeWidth={1} strokeDasharray="5 4" />
      {/* eigen line — solid, 2px */}
      <path d={buildPath(eigenH)} fill="none" stroke="#000" strokeWidth={2} />

      {eigenLast && (
        <g>
          <line
            x1={xPx(eigenLast.trial)}
            x2={W - PAD_R + 6}
            y1={yPx(eigenLast.rate)}
            y2={yPx(eigenLast.rate)}
            stroke="#000"
            strokeWidth={1}
          />
          <text
            x={W - PAD_R + 8}
            y={yPx(eigenLast.rate) + 3}
            fontSize={10}
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            EIGEN: {(eigenRate * 100).toFixed(1)}%
          </text>
        </g>
      )}
      {uniformLast && (
        <g>
          <line
            x1={xPx(uniformLast.trial)}
            x2={W - PAD_R + 6}
            y1={yPx(uniformLast.rate)}
            y2={yPx(uniformLast.rate)}
            stroke="#000"
            strokeWidth={1}
            strokeDasharray="2 3"
          />
          <text
            x={W - PAD_R + 8}
            y={yPx(uniformLast.rate) + 3}
            fontSize={10}
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            UNIFORM: {(uniformRate * 100).toFixed(1)}%
          </text>
        </g>
      )}
    </svg>
  );
}
