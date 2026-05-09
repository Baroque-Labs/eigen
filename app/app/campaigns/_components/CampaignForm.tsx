"use client";

import { useActionState } from "react";
import type { CampaignFormResult } from "@/app/_lib/campaigns/actions";
import { MarkdownEditor } from "./MarkdownEditor";

type Props = {
  action: (
    prev: CampaignFormResult | null,
    formData: FormData,
  ) => Promise<CampaignFormResult>;
  defaults?: {
    id?: string;
    name?: string;
    baselineSubject?: string;
    baselineBodyMd?: string;
  };
  submitLabel: string;
  pendingLabel: string;
  greetingName: string;
};

export function CampaignForm({
  action,
  defaults,
  submitLabel,
  pendingLabel,
  greetingName,
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {defaults?.id ? (
        <input type="hidden" name="id" value={defaults.id} />
      ) : null}

      <div>
        <label htmlFor="name" className="block text-sm mb-1">
          Name
        </label>
        <input
          id="name"
          name="name"
          required
          defaultValue={defaults?.name ?? ""}
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
          defaultValue={defaults?.baselineSubject ?? ""}
          placeholder="We're closing the founding round at midnight"
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
        />
      </div>

      <div>
        <label htmlFor="baseline_body_md" className="block text-sm mb-1">
          Baseline body
          <span className="text-ink/40 ml-2 font-mono text-xs">
            markdown · live preview · {`{{first_name}}`} merge fields
          </span>
        </label>
        <MarkdownEditor
          id="baseline_body_md"
          name="baseline_body_md"
          required
          rows={12}
          defaultValue={defaults?.baselineBodyMd ?? ""}
          placeholder={
            "Hey {{first_name}},\n\nThe founding round closes at midnight..."
          }
          sampleValues={{ first_name: greetingName }}
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
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
