type Props = {
  eigenImpressions: number;
  eigenConversions: number;
  eigenRate: number;
  uniformImpressions: number;
  uniformConversions: number;
  uniformRate: number;
  advantagePp: number;
};

export function TotalsTable({
  eigenImpressions,
  eigenConversions,
  eigenRate,
  uniformImpressions,
  uniformConversions,
  uniformRate,
  advantagePp,
}: Props) {
  const sign = advantagePp >= 0 ? "+" : "−";
  return (
    <div className="border border-ink overflow-x-auto">
      <table className="w-full text-[14px] tabular-nums">
        <thead>
          <tr className="border-b border-ink font-mono text-[10px] uppercase tracking-[0.16em] text-ink/70">
            <th className="text-left py-2 px-3 font-normal">Metric</th>
            <th className="text-right py-2 px-3 font-normal">Eigen</th>
            <th className="text-right py-2 px-3 font-normal">Uniform</th>
            <th className="text-right py-2 px-3 font-normal">
              Δ (Eigen − Uniform)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-ink/15">
            <td className="py-2 px-3 font-mono text-[12px]">Impressions</td>
            <td className="py-2 px-3 text-right">
              {eigenImpressions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {uniformImpressions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right text-ink/50">—</td>
          </tr>
          <tr className="border-b border-ink/15">
            <td className="py-2 px-3 font-mono text-[12px]">Conversions</td>
            <td className="py-2 px-3 text-right">
              {eigenConversions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {uniformConversions.toLocaleString()}
            </td>
            <td className="py-2 px-3 text-right">
              {eigenConversions - uniformConversions >= 0 ? "+" : "−"}
              {Math.abs(eigenConversions - uniformConversions).toLocaleString()}
            </td>
          </tr>
          <tr>
            <td className="py-2 px-3 font-mono text-[12px]">Conv. rate</td>
            <td className="py-2 px-3 text-right">
              {(eigenRate * 100).toFixed(2)}%
            </td>
            <td className="py-2 px-3 text-right">
              {(uniformRate * 100).toFixed(2)}%
            </td>
            <td className="py-2 px-3 text-right">
              {sign}
              {Math.abs(advantagePp).toFixed(2)} pp
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
