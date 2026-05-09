import type { SimState, Variant } from "../_types";

export function AllocationChart({
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
  const history = sim.allocationHistory;

  if (history.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="block w-full h-auto">
        <rect
          x={PAD_L}
          y={PAD_T}
          width={plotW}
          height={plotH}
          fill="none"
          stroke="#000"
          strokeWidth={1}
        />
        <text
          x={W / 2}
          y={H / 2}
          fontSize={10}
          textAnchor="middle"
          fill="#000"
          style={{ fontFamily: "var(--font-mono)" }}
        >
          warming up...
        </text>
      </svg>
    );
  }

  const xPx = (t: number) => PAD_L + (t / trial) * plotW;
  const yPx = (frac: number) => PAD_T + plotH - frac * plotH;

  const stacked: Array<{ trial: number; cum: number[] }> = history.map(
    (snap) => {
      let acc = 0;
      const cum: number[] = [];
      for (const v of variants) {
        acc += snap.alloc[v.id] ?? 0;
        cum.push(acc);
      }
      return { trial: snap.trial, cum };
    },
  );

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="block w-full h-auto"
      preserveAspectRatio="xMidYMid meet"
    >
      <rect
        x={PAD_L}
        y={PAD_T}
        width={plotW}
        height={plotH}
        fill="none"
        stroke="#000"
        strokeWidth={1}
      />

      <text
        x={PAD_L - 4}
        y={PAD_T + 4}
        fontSize={10}
        textAnchor="end"
        fill="#000"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        100%
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

      {variants.map((v, i) => {
        const topPts = stacked.map(
          (s) =>
            `${xPx(s.trial).toFixed(1)},${yPx(s.cum[i]).toFixed(1)}`,
        );
        const bottomPts = stacked
          .slice()
          .reverse()
          .map(
            (s) =>
              `${xPx(s.trial).toFixed(1)},${yPx(i === 0 ? 0 : s.cum[i - 1]).toFixed(1)}`,
          );
        const points = topPts.concat(bottomPts).join(" ");
        return (
          <polygon
            key={v.id}
            points={points}
            fill={v.color}
            stroke="none"
          />
        );
      })}
    </svg>
  );
}
