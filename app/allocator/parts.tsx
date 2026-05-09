import type { AllocatorSlot } from "@/app/_data/allocator-scenario";

export const TRANSITION_MS = 700;

export function Row({ slot }: { slot: AllocatorSlot }) {
  const isUnborn = slot.status === "unborn";
  const isRetired = slot.status === "retired";
  const isLeading = slot.status === "leading";
  const isNew = slot.status === "new";

  const trials = slot.s + slot.f;
  const pct = Math.round(slot.alloc * 100);

  return (
    <div
      className="overflow-hidden transition-all ease-out"
      style={{
        maxHeight: isUnborn ? 0 : 80,
        opacity: isUnborn ? 0 : isRetired ? 0.32 : 1,
        transitionDuration: `${TRANSITION_MS}ms`,
      }}
      aria-hidden={isUnborn}
    >
      <div className="grid grid-cols-12 gap-3 md:gap-5 items-center py-3 md:py-3.5">
        <div className="col-span-2 md:col-span-1 font-mono text-[14px] md:text-[15px] text-paper">
          {slot.label || "—"}
        </div>

        <div className="col-span-7 md:col-span-7">
          <div className="relative h-2.5 md:h-3 border border-paper">
            <div
              className="absolute inset-y-0 left-0 bg-paper ease-out"
              style={{
                width: `${pct}%`,
                transitionProperty: "width",
                transitionDuration: `${TRANSITION_MS}ms`,
              }}
            />
          </div>
        </div>

        <div className="col-span-3 md:col-span-1 font-mono text-[13px] md:text-[14px] text-paper tabular-nums">
          {pct}%
        </div>

        <div className="col-span-12 md:col-span-3 flex items-center justify-between md:justify-end gap-3 md:gap-4 -mt-1 md:mt-0">
          <span className="font-mono text-[12px] md:text-[13px] text-paper/80 tabular-nums">
            {slot.s} / {trials}
          </span>
          <StatusPill
            isLeading={isLeading}
            isRetired={isRetired}
            isNew={isNew}
            parent={slot.parent}
          />
        </div>
      </div>
    </div>
  );
}

function StatusPill({
  isLeading,
  isRetired,
  isNew,
  parent,
}: {
  isLeading: boolean;
  isRetired: boolean;
  isNew: boolean;
  parent?: string;
}) {
  if (isRetired) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/60 border border-paper/40 px-2 py-0.5">
        retired
      </span>
    );
  }
  if (isNew) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper border border-paper px-2 py-0.5 whitespace-nowrap">
        ← spawned{parent ? ` from ${parent}` : ""}
      </span>
    );
  }
  if (isLeading) {
    return (
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink bg-paper px-2 py-0.5">
        leading
      </span>
    );
  }
  return (
    <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-paper/50 border border-paper/30 px-2 py-0.5">
      active
    </span>
  );
}
