import type { SimState, Variant } from "../_types";

export function ConversionRatesChart({
  sim,
  variants,
}: {
  sim: SimState;
  variants: Variant[];
}) {
  const W = 520;
  const H = 200;
  const PAD_L = 40;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;

  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const trial = Math.max(sim.trial, 1);

  let yMax = 0.05;
  for (const v of variants) {
    for (const p of v.posteriorMeanHistory) {
      if (p.mean > yMax) yMax = p.mean;
    }
  }
  yMax = Math.min(1, yMax * 1.2);

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (y: number) => PAD_T + plotH - (y / yMax) * plotH;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={PAD_T + plotH}
        y2={PAD_T + plotH}
        stroke="#000"
        strokeWidth={1}
      />
      <line
        x1={PAD_L}
        x2={PAD_L}
        y1={PAD_T}
        y2={PAD_T + plotH}
        stroke="#000"
        strokeWidth={1}
      />

      <text
        x={PAD_L}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="start"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0
      </text>
      <text
        x={W - PAD_R}
        y={PAD_T + plotH + 16}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {sim.trial}
      </text>

      <text
        x={PAD_L - 4}
        y={PAD_T + 4}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {(yMax * 100).toFixed(0)}%
      </text>
      <text
        x={PAD_L - 4}
        y={PAD_T + plotH}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        0%
      </text>

      {variants.map((v) => {
        if (v.posteriorMeanHistory.length < 2) return null;
        const opacity = v.status === "active" ? 1 : 0.3;
        const d = v.posteriorMeanHistory
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xPx(p.trial).toFixed(1)} ${yPx(p.mean).toFixed(1)}`,
          )
          .join(" ");
        return (
          <path
            key={v.id}
            d={d}
            fill="none"
            stroke={v.color}
            strokeWidth={1.5}
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
