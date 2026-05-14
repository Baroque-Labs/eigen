"use client";

import { useActionState } from "react";
import { deleteCampaignAction } from "@/app/_lib/campaigns/actions";

export function DeleteCampaignButton({
  campaignId,
  name,
  variant = "icon",
}: {
  campaignId: number;
  name: string;
  variant?: "icon" | "labeled";
}) {
  const [state, action, pending] = useActionState(deleteCampaignAction, null);

  function confirmThenSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (
      !confirm(
        `Delete "${name}"? This wipes the campaign, every variant, every send, every event, and every decision. No undo.`,
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form action={action} onSubmit={confirmThenSubmit} className="inline-flex">
      <input type="hidden" name="campaign_id" value={campaignId} />
      {variant === "icon" ? (
        <button
          type="submit"
          disabled={pending}
          title={`Delete ${name}`}
          aria-label={`Delete ${name}`}
          className="opacity-40 hover:opacity-100 hover:text-red-700 text-ink/60 text-xs px-2 py-1 disabled:opacity-30"
        >
          ✕
        </button>
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="px-3 py-1.5 text-xs font-mono uppercase tracking-[0.12em] border border-ink/20 hover:border-red-700 hover:text-red-700 disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete campaign"}
        </button>
      )}
      {state?.error ? (
        <span className="text-xs text-red-700 ml-2 self-center">{state.error}</span>
      ) : null}
    </form>
  );
}
