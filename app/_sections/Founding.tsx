import { CTAButton } from "@/app/_components/CTAButton";
import { SectionHeader } from "@/app/_components/SectionHeader";
import { FOUNDING_BENEFITS } from "@/app/_data/founding-benefits";
import { CHECKOUT_URL, SPOTS_REMAINING, SPOTS_TOTAL } from "@/app/_lib/constants";
import { SectionMark } from "./SectionMark";

export function Founding() {
  return (
    <section id="founding" className="bg-paper text-ink border-b border-ink">
      <SectionMark />

      <div className="px-8 md:px-16 pt-10 md:pt-16 pb-20 md:pb-40">
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 md:col-span-7">
            <SectionHeader
              label="Founding round"
              titleSize="lg"
              title={
                <>
                  10 founding spots.
                  <br />
                  <span className="text-ink/40">$100 each.</span>
                </>
              }
            />
          </div>

          <div className="col-span-12 md:col-span-5 md:pt-8">
            <ul className="border-t border-ink">
              {FOUNDING_BENEFITS.map((b) => (
                <li
                  key={b}
                  className="border-b border-ink py-5 flex gap-4 items-start"
                >
                  <span className="font-serif text-[20px] leading-none text-ink pt-1 w-6 shrink-0">
                    •
                  </span>
                  <span className="text-[16px] leading-snug">{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-stretch md:items-start gap-3">
              <CTAButton href={CHECKOUT_URL} variant="primary" className="px-7">
                Claim a founding spot — $100
              </CTAButton>
              <span className="font-mono text-[12px] text-ink/70 text-center md:text-left">
                {SPOTS_REMAINING} of {SPOTS_TOTAL} spots remaining
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
