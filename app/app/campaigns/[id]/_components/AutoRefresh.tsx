"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Polls the server component on an interval by calling router.refresh().
 * Next re-runs the page server-side, which re-fetches the backend state
 * without a full page reload — no flicker, no client cache to manage.
 *
 * Render a tiny pulse indicator so the user can see it's live and pause if
 * they want.
 */
export function AutoRefresh({ intervalMs = 3000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [paused, setPaused] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      router.refresh();
      setTick((v) => v + 1);
    }, intervalMs);
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
      <span className="text-ink/30" suppressHydrationWarning>
        {tick > 0 && !paused ? `· ${tick}` : ""}
      </span>
    </button>
  );
}
