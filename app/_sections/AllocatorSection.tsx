import { AllocatorDiagram } from "@/app/allocator/AllocatorDiagram";
import { SectionHeader } from "@/app/_components/SectionHeader";
import { SectionMark } from "./SectionMark";

export function AllocatorSection() {
  return (
    <section className="section-black bg-ink text-paper border-b border-paper">
      <SectionMark dark />
      <div className="px-8 md:px-16 pt-10 md:pt-16 pb-20 md:pb-40">
        <div className="max-w-[1100px]">
          <SectionHeader
            tone="paper"
            label="Allocation + generation"
            title="The optimizer, in motion."
            titleMaxCh={14}
          />
        </div>

        <div className="mt-16 md:mt-24">
          <AllocatorDiagram />
        </div>

        <p className="mt-8 max-w-[68ch] font-mono text-[12px] leading-relaxed text-paper/60">
          Each send is evidence. Posteriors update. Allocation tracks Pr(variant
          is best). Winners compound, losers retire, and new variants spawn from
          the leader — automatically.
        </p>
      </div>
    </section>
  );
}
