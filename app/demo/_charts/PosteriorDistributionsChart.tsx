import { useMemo } from "react";
import { betaMean, betaPdf } from "@/app/_lib/beta";
import type { Variant } from "../_types";

export function PosteriorDistributionsChart({
  variants,
}: {
  variants: Variant[];
}) {
  const W = 520;
  const H = 200;
  const PAD_L = 36;
  const PAD_R = 16;
  const PAD_T = 12;
  const PAD_B = 28;
  const plotW = W - PAD_L - PAD_R;
  const plotH = H - PAD_T - PAD_B;

  const X_MIN = 0;
  const X_MAX = 0.5;
  const SAMPLES = 160;

  const curves = useMemo(() => {
    let yMax = 0;
    const list = variants.map((v) => {
      const pts: { x: number; y: number }[] = [];
      for (let i = 1; i < SAMPLES; i++) {
        const x = X_MIN + ((X_MAX - X_MIN) * i) / SAMPLES;
        const y = betaPdf(x, v.alpha, v.beta);
        pts.push({ x, y });
        if (y > yMax) yMax = y;
      }
      return { variant: v, pts };
    });
    if (yMax <= 0) yMax = 1;
    return { list, yMax };
  }, [variants]);

  const xPx = (x: number) =>
    PAD_L + ((x - X_MIN) / (X_MAX - X_MIN)) * plotW;
  const yPx = (y: number) =>
    PAD_T + plotH - (y / curves.yMax) * plotH;

  const xTicks = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5];

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

      {xTicks.map((t) => (
        <g key={t}>
          <line
            x1={xPx(t)}
            x2={xPx(t)}
            y1={PAD_T + plotH}
            y2={PAD_T + plotH + 4}
            stroke="#000"
            strokeWidth={1}
          />
          <text
            x={xPx(t)}
            y={PAD_T + plotH + 16}
            fontSize={10}
            textAnchor="middle"
            fill="#000"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {(t * 100).toFixed(0)}%
          </text>
        </g>
      ))}

      {curves.list.map(({ variant, pts }) => {
        const opacity = variant.status === "active" ? 1 : 0.25;
        const d = pts
          .map(
            (p, i) =>
              `${i === 0 ? "M" : "L"} ${xPx(p.x).toFixed(2)} ${yPx(p.y).toFixed(2)}`,
          )
          .join(" ");
        const mean = betaMean(variant.alpha, variant.beta);
        let peakY = 0;
        for (const p of pts) if (p.y > peakY) peakY = p.y;
        const meanInRange = mean >= X_MIN && mean <= X_MAX;
        return (
          <g key={variant.id} opacity={opacity}>
            <path
              d={d}
              fill="none"
              stroke={variant.color}
              strokeWidth={1.5}
            />
            {meanInRange && (
              <line
                x1={xPx(mean)}
                x2={xPx(mean)}
                y1={yPx(peakY)}
                y2={PAD_T + plotH}
                stroke={variant.color}
                strokeWidth={1}
                strokeDasharray="2 2"
                opacity={0.7}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
