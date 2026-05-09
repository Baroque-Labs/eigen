"use client";

import { useActionState } from "react";
import { sendTestEmail } from "@/app/_lib/campaigns/actions";

export function SendTestButton({ campaignId }: { campaignId: string }) {
  const [state, formAction, pending] = useActionState(sendTestEmail, null);

  return (
    <form action={formAction} className="flex items-center gap-3">
      <input type="hidden" name="campaign_id" value={campaignId} />
      <button
        type="submit"
        disabled={pending}
        className="px-3 py-1.5 text-sm rounded border border-ink/20 hover:bg-ink/5 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send test to me"}
      </button>
      {state?.ok ? (
        <span className="text-xs text-emerald-700">Sent to {state.to}</span>
      ) : null}
      {state?.error ? (
        <span className="text-xs text-red-700">{state.error}</span>
      ) : null}
    </form>
  );
}
