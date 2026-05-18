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

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label htmlFor="n_variants" className="block text-sm mb-1">
            Variants
          </label>
          <input
            id="n_variants"
            name="n_variants"
            type="number"
            min={1}
            max={64}
            defaultValue={4}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
        <div>
          <label htmlFor="batch_size" className="block text-sm mb-1">
            Batch size
            <span className="text-ink/40 ml-2 font-mono text-xs">recipients</span>
          </label>
          <input
            id="batch_size"
            name="batch_size"
            type="number"
            min={1}
            defaultValue={100}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
        <div>
          <label htmlFor="cadence_value" className="block text-sm mb-1">
            Cadence
          </label>
          <div className="flex gap-2">
            <input
              id="cadence_value"
              name="cadence_value"
              type="number"
              min={1}
              defaultValue={60}
              className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
            />
            <select
              name="cadence_unit"
              defaultValue="minutes"
              className="border border-ink/15 rounded px-2 py-2 text-sm focus:outline-none focus:border-ink/40"
            >
              <option value="minutes">minutes</option>
              <option value="hours">hours</option>
              <option value="days">days</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div className="text-sm mb-1">Calendar</div>
        <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/40 mb-2">
          Days · check none = any
        </div>
        <div className="flex gap-3 flex-wrap mb-3">
          {[
            ["Mon", 1],
            ["Tue", 2],
            ["Wed", 3],
            ["Thu", 4],
            ["Fri", 5],
            ["Sat", 6],
            ["Sun", 7],
          ].map(([label, val]) => (
            <label key={val} className="text-xs flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                name="weekdays"
                value={String(val)}
                defaultChecked={[1, 2, 3, 4, 5].includes(val as number)}
              />
              {label}
            </label>
          ))}
        </div>
        <div className="text-[10px] font-mono uppercase tracking-[0.12em] text-ink/40 mb-2">
          Hours · check none = any
        </div>
        <div className="grid grid-cols-12 gap-2 mb-3">
          {Array.from({ length: 24 }, (_, h) => h).map((h) => (
            <label key={h} className="text-xs flex flex-col items-center cursor-pointer">
              <input
                type="checkbox"
                name="hours"
                value={String(h)}
                defaultChecked={h >= 9 && h <= 17}
              />
              <span className="font-mono text-[10px] text-ink/50">{h}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="timezone" className="block text-sm mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            defaultValue="America/Denver"
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink/40"
          >
            {[
              "UTC",
              "America/New_York",
              "America/Chicago",
              "America/Denver",
              "America/Phoenix",
              "America/Los_Angeles",
              "America/Anchorage",
              "Pacific/Honolulu",
              "America/Toronto",
              "America/Mexico_City",
              "America/Sao_Paulo",
              "Europe/London",
              "Europe/Dublin",
              "Europe/Paris",
              "Europe/Berlin",
              "Europe/Madrid",
              "Europe/Amsterdam",
              "Europe/Stockholm",
              "Europe/Athens",
              "Europe/Moscow",
              "Africa/Johannesburg",
              "Asia/Dubai",
              "Asia/Kolkata",
              "Asia/Singapore",
              "Asia/Hong_Kong",
              "Asia/Shanghai",
              "Asia/Tokyo",
              "Asia/Seoul",
              "Australia/Sydney",
              "Pacific/Auckland",
            ].map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="settle_window_hours" className="block text-sm mb-1">
            Settle window
            <span className="text-ink/40 ml-2 font-mono text-xs">hours (sim time)</span>
          </label>
          <input
            id="settle_window_hours"
            name="settle_window_hours"
            type="number"
            min={0.01}
            step={0.01}
            defaultValue={24}
            className="w-full border border-ink/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-ink/40"
          />
        </div>
      </div>

      <div>
        <label htmlFor="emails" className="block text-sm mb-1">
          Recipient emails
          <span className="text-ink/40 ml-2 font-mono text-xs">
            paste a list — comma, space, or newline separated
          </span>
        </label>
        <textarea
          id="emails"
          name="emails"
          required
          rows={8}
          placeholder="a@example.com&#10;b@example.com&#10;c@example.com"
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
          {pending ? pendingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
