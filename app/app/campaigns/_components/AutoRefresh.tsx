"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(t);
  }, [paused, intervalMs, router]);

  return (
    <button
      type="button"
      onClick={() => setPaused((p) => !p)}
      title={paused ? "Resume auto-refresh" : "Pause auto-refresh"}
      className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/50 hover:text-ink/80 flex items-center gap-2"
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          paused ? "bg-ink/20" : "bg-emerald-600 animate-pulse"
        }`}
      />
      {paused ? "Paused" : `Live · ${Math.round(intervalMs / 1000)}s`}
    </button>
  );
}
