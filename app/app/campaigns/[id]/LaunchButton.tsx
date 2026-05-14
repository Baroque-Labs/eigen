"use client";

import { useActionState } from "react";
import { launchCampaignAction, runResearchAction } from "@/app/_lib/campaigns/actions";

export function LaunchButton({
  campaignId,
  disabled,
}: {
  campaignId: number;
  disabled?: boolean;
}) {
  const [launchState, launch, launching] = useActionState(launchCampaignAction, null);
  const [researchState, research, researching] = useActionState(runResearchAction, null);

  return (
    <div className="flex items-center gap-2">
      <form action={launch}>
        <input type="hidden" name="campaign_id" value={campaignId} />
        <button
          type="submit"
          disabled={disabled || launching}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] bg-ink text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {launching ? "Ticking…" : "Tick"}
        </button>
      </form>
      <form action={research}>
        <input type="hidden" name="campaign_id" value={campaignId} />
        <button
          type="submit"
          disabled={disabled || researching}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] border border-ink/20 hover:bg-ink/5 disabled:opacity-50"
        >
          {researching ? "Researching…" : "Research"}
        </button>
      </form>
      {launchState?.error || researchState?.error ? (
        <span className="text-xs text-red-700">
          {launchState?.error ?? researchState?.error}
        </span>
      ) : null}
    </div>
  );
}
