import { MonoLabel } from "@/app/_components/MonoLabel";
import { FAQ_ITEMS } from "@/app/_data/faq";
import { SectionMark } from "./SectionMark";

export function FAQ() {
  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 pt-10 md:pt-16 pb-20 md:pb-40">
        <div className="max-w-[1100px]">
          <MonoLabel tone="paper" className="mb-10 block">
            Questions
          </MonoLabel>
          <h2 className="font-display text-[44px] md:text-[72px] leading-[0.98] max-w-[18ch]">
            Frequently asked.
          </h2>
        </div>

        <div className="mt-16 md:mt-24 max-w-[900px] border-t border-paper">
          {FAQ_ITEMS.map((item, i) => (
            <details
              key={i}
              className="group border-b border-paper py-6 md:py-8"
            >
              <summary className="flex items-baseline gap-6 md:gap-10">
                <span className="font-mono text-[12px] text-paper/60 w-8 shrink-0 pt-2">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-[24px] md:text-[34px] leading-[1.15] flex-1">
                  {item.q}
                </span>
                <span
                  aria-hidden
                  className="font-serif text-[28px] leading-none transition-transform group-open:rotate-45 origin-center"
                >
                  +
                </span>
              </summary>
              <div className="mt-5 md:ml-[80px] max-w-[60ch]">
                <p
                  className="text-[16px] leading-relaxed text-paper/80"
                  dangerouslySetInnerHTML={{ __html: item.a }}
                />
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
