import type { Variant } from "../_types";

export function VariantLegend({ variants }: { variants: Variant[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-ink/15 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/70">
      {variants.map((v) => {
        const faded = v.status !== "active";
        return (
          <span
            key={v.id}
            className="inline-flex items-center gap-1.5"
            style={{ opacity: faded ? 0.4 : 1 }}
          >
            <span
              className="inline-block w-2.5 h-2.5"
              style={{ backgroundColor: v.color }}
              aria-hidden
            />
            <span style={{ textDecoration: faded ? "line-through" : "none" }}>
              V{String(v.index).padStart(2, "0")}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function EigenUniformLegend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-3 pt-3 border-t border-ink/15 font-mono text-[10px] uppercase tracking-[0.14em] text-ink/70">
      <span className="inline-flex items-center gap-2">
        <svg width="22" height="6" aria-hidden>
          <line x1="0" y1="3" x2="22" y2="3" stroke="#000" strokeWidth="2" />
        </svg>
        Eigen
      </span>
      <span className="inline-flex items-center gap-2">
        <svg width="22" height="6" aria-hidden>
          <line
            x1="0"
            y1="3"
            x2="22"
            y2="3"
            stroke="#000"
            strokeWidth="1"
            strokeDasharray="4 3"
          />
        </svg>
        Uniform
      </span>
    </div>
  );
}
