"use client";

import { useActionState } from "react";
import { createCampaign } from "@/app/_lib/campaigns/actions";

export function NewCampaignForm() {
  const [state, formAction, pending] = useActionState(createCampaign, null);

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          placeholder="Founding round announcement"
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
        />
      </div>

      <div>
        <label htmlFor="baseline_subject" className="block text-sm mb-1">
          Baseline subject
        </label>
        <input
          id="baseline_subject"
          name="baseline_subject"
          required
          placeholder="We're closing the founding round at midnight"
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
        />
      </div>

      <div>
        <label htmlFor="baseline_body_md" className="block text-sm mb-1">
          Baseline body
          <span className="text-ink/40 ml-2 font-mono text-xs">markdown</span>
        </label>
        <textarea
          id="baseline_body_md"
          name="baseline_body_md"
          required
          rows={10}
          placeholder={"Hey {{first_name}},\n\nThe founding round closes at midnight..."}
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink/40"
        />
      </div>

      {state?.error ? (
        <p className="text-sm text-red-700">{state.error}</p>
      ) : null}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm rounded bg-ink text-paper hover:bg-ink/90 disabled:opacity-50"
        >
          {pending ? "Creating…" : "Create campaign"}
        </button>
      </div>
    </form>
  );
}
