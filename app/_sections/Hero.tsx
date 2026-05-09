import Image from "next/image";
import { CTAButton } from "@/app/_components/CTAButton";
import { Logo } from "@/app/_components/Logo";
import { CHECKOUT_URL, SPOTS_REMAINING, SPOTS_TOTAL } from "@/app/_lib/constants";

export function Hero() {
  return (
    <section className="relative min-h-screen w-full bg-paper text-ink border-b border-ink">
      <div className="grid min-h-screen grid-cols-1 md:grid-cols-5">
        {/* Image — 60% on desktop, full-bleed on mobile.
            Three Monet "Houses of Parliament" paintings crossfade on a 24s loop. */}
        <div className="relative h-[60vh] md:h-auto md:col-span-3 border-b md:border-b-0 md:border-r border-ink overflow-hidden grain bg-ink">
          <Image
            src="/parliament-sunset.jpg"
            alt="Houses of Parliament, Sunset — Monet, 1903"
            fill
            priority
            sizes="(min-width: 768px) 60vw, 100vw"
            className="monet-1 object-cover"
          />
          <Image
            src="/parliament-fog.jpg"
            alt="Houses of Parliament, Effect of Fog — Monet, 1904"
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="monet-2 object-cover"
          />
          <Image
            src="/parliament-stormy.jpg"
            alt="Houses of Parliament, Stormy Sky — Monet, 1904"
            fill
            sizes="(min-width: 768px) 60vw, 100vw"
            className="monet-3 object-cover"
          />

          <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6 z-10 font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-paper/75">
            Claude Monet — Houses of Parliament, 1903–1904
          </div>
        </div>

        {/* Content — 40% */}
        <div className="md:col-span-2 flex flex-col justify-between p-8 md:p-12">
          <Logo />

          <div className="flex-1 flex flex-col justify-center max-w-xl py-12">
            <h1 className="font-display text-[52px] leading-[0.95] md:text-[88px] md:leading-[0.92]">
              Email that optimizes itself.
            </h1>
            <p className="mt-8 text-[19px] leading-relaxed text-ink/80 max-w-md">
              Eigen runs Thompson sampling over your variants in production —
              killing losers, compounding winners, and spawning new variants the
              moment a test reaches significance. Continuously. Bayesianly.
            </p>

            <div className="mt-10 flex flex-col items-stretch md:items-start gap-3">
              <CTAButton href={CHECKOUT_URL} variant="primary">
                Claim a founding spot — $100
              </CTAButton>
              <CTAButton href="/demo" variant="secondary">
                Try the live demo →
              </CTAButton>
              <span className="font-mono text-[12px] text-ink/70 mt-1 text-center md:text-left">
                {SPOTS_REMAINING} of {SPOTS_TOTAL} spots remaining
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60">
            <span>est. 2026</span>
            <span>v0 · founding round</span>
          </div>
        </div>
      </div>
    </section>
  );
}
