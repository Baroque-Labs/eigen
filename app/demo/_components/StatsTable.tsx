import { betaMean } from "@/app/_lib/beta";
import type { Variant } from "../_types";
import { FADE_DURATION_MS } from "../_constants";

export function StatsTable({
  variants,
  showTrueRate,
}: {
  variants: Variant[];
  showTrueRate: boolean;
}) {
  return (
    <div className="border border-ink overflow-x-auto">
      <table className="w-full text-[13px] tabular-nums">
        <thead>
          <tr className="border-b border-ink font-mono text-[10px] uppercase tracking-[0.16em] text-ink/70">
            <th className="text-left py-2 px-3 font-normal">Variant</th>
            <th className="text-left py-2 px-3 font-normal">Axis</th>
            <th className="text-right py-2 px-3 font-normal">Impressions</th>
            <th className="text-right py-2 px-3 font-normal">Conversions</th>
            <th className="text-right py-2 px-3 font-normal">Conv. rate</th>
            {showTrueRate && (
              <th className="text-right py-2 px-3 font-normal">True rate</th>
            )}
          </tr>
        </thead>
        <tbody>
          {variants.map((v, i) => {
            const rate = betaMean(v.alpha, v.beta);
            const faded = v.status !== "active";
            return (
              <tr
                key={v.id}
                className={`${
                  i < variants.length - 1 ? "border-b border-ink/15" : ""
                }`}
                style={{
                  opacity: faded ? 0.45 : 1,
                  transition: `opacity ${FADE_DURATION_MS}ms linear`,
                }}
              >
                <td className="py-2 px-3 font-mono text-[12px]">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 shrink-0"
                      style={{ backgroundColor: v.color }}
                      aria-hidden
                    />
                    <span
                      style={{
                        textDecoration: faded ? "line-through" : "none",
                      }}
                    >
                      V{String(v.index).padStart(2, "0")}
                    </span>
                  </span>
                </td>
                <td className="py-2 px-3 text-ink/70 truncate max-w-[260px]">
                  {v.axis}
                </td>
                <td className="py-2 px-3 text-right">{v.impressions}</td>
                <td className="py-2 px-3 text-right">{v.conversions}</td>
                <td className="py-2 px-3 text-right">
                  {(rate * 100).toFixed(1)}%
                </td>
                {showTrueRate && (
                  <td
                    className="py-2 px-3 text-right font-mono"
                    style={{ color: v.color }}
                  >
                    {(v.trueRate * 100).toFixed(1)}%
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
