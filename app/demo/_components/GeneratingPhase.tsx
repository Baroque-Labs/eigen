export function GeneratingPhase() {
  return (
    <section className="px-6 md:px-10 min-h-[60vh] flex flex-col items-center justify-center">
      <h2 className="font-display text-[40px] md:text-[56px] leading-[1] tracking-tight">
        Generating variants
      </h2>
      <DotPulse className="mt-8" />
    </section>
  );
}

export function DotPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="dot-pulse-1 font-mono text-[28px] leading-none">.</span>
      <span className="dot-pulse-2 font-mono text-[28px] leading-none">.</span>
      <span className="dot-pulse-3 font-mono text-[28px] leading-none">.</span>
      <style>{`
        @keyframes dotpulse {
          0%, 60%, 100% { opacity: 0.2; }
          30%           { opacity: 1; }
        }
        .dot-pulse-1 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0s; }
        .dot-pulse-2 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0.2s; }
        .dot-pulse-3 { animation: dotpulse 1.2s ease-in-out infinite; animation-delay: 0.4s; }
      `}</style>
    </div>
  );
}
