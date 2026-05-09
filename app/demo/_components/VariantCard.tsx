import type { Variant } from "../_types";
import { FADE_DURATION_MS } from "../_constants";

export function VariantCard({ variant }: { variant: Variant }) {
  const isDying = variant.status === "dying";
  const isDead = variant.status === "dead";
  const faded = isDying || isDead;

  return (
    <article
      className="shrink-0 w-[380px] border border-ink p-6 bg-paper flex flex-col"
      style={{
        opacity: faded ? 0.3 : 1,
        transition: `opacity ${FADE_DURATION_MS}ms linear`,
        animation:
          variant.bornAtTrial > 0 && !faded
            ? "variant-slide-in 600ms ease-out both"
            : undefined,
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-3 h-3 shrink-0"
            style={{ backgroundColor: variant.color }}
            aria-hidden
          />
          <span
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink"
            style={{ textDecoration: faded ? "line-through" : "none" }}
          >
            VARIANT_{String(variant.index).padStart(2, "0")}
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/60 truncate ml-2">
          {variant.axis}
        </span>
      </div>

      <div className="font-serif text-[22px] leading-tight mb-3">
        {variant.subject || "(no subject)"}
      </div>
      <div className="text-[14px] text-ink/80 leading-relaxed whitespace-pre-line">
        {variant.body.trim() || "(empty body)"}
      </div>
    </article>
  );
}
