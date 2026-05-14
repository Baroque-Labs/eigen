"use client";

import { useActionState } from "react";
import {
  approveVariantAction,
  rejectVariantAction,
} from "@/app/_lib/campaigns/actions";

export function ApproveRejectForm({
  campaignId,
  variantId,
}: {
  campaignId: number;
  variantId: number;
}) {
  const [approveState, approve, approving] = useActionState(
    approveVariantAction,
    null,
  );
  const [rejectState, reject, rejecting] = useActionState(
    rejectVariantAction,
    null,
  );

  return (
    <div className="flex gap-3">
      <form action={approve}>
        <input type="hidden" name="campaign_id" value={campaignId} />
        <input type="hidden" name="variant_id" value={variantId} />
        <button
          type="submit"
          disabled={approving || rejecting}
          className="px-4 py-2 text-xs font-mono uppercase tracking-[0.12em] bg-ink text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {approving ? "Approving…" : "Approve"}
        </button>
      </form>
      <form action={reject}>
        <input type="hidden" name="campaign_id" value={campaignId} />
        <input type="hidden" name="variant_id" value={variantId} />
        <button
          type="submit"
          disabled={approving || rejecting}
          className="px-4 py-2 text-xs font-mono uppercase tracking-[0.12em] border border-ink/20 hover:bg-ink/5 disabled:opacity-50"
        >
          {rejecting ? "Rejecting…" : "Reject"}
        </button>
      </form>
      {(approveState?.error || rejectState?.error) ? (
        <span className="text-xs text-red-700 self-center">
          {approveState?.error ?? rejectState?.error}
        </span>
      ) : null}
    </div>
  );
}
