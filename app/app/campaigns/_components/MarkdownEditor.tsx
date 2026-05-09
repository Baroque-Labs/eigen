"use client";

import { useMemo, useState } from "react";
import {
  extractMergeFields,
  renderMarkdown,
  type MergeValues,
} from "@/app/_lib/markdown/render";

type Props = {
  id?: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  // Sample values used in the live preview only — recipients see
  // their own values at send time. Useful so the user can see how a
  // greeting renders before they save.
  sampleValues?: MergeValues;
};

export function MarkdownEditor({
  id,
  name,
  defaultValue = "",
  placeholder,
  rows = 14,
  required,
  sampleValues = { first_name: "Justin" },
}: Props) {
  const [value, setValue] = useState(defaultValue);

  const html = useMemo(
    () => renderMarkdown(value, sampleValues),
    [value, sampleValues],
  );
  const fields = useMemo(() => extractMergeFields(value), [value]);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <textarea
          id={id}
          name={name}
          required={required}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-full border border-ink/15 rounded px-3 py-2 text-sm font-mono focus:outline-none focus:border-ink/40"
        />
        <div
          aria-label="Preview"
          className="border border-ink/10 rounded px-4 py-3 text-sm bg-ink/[.02] overflow-auto prose-email"
          style={{ minHeight: `${rows * 1.5}rem` }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      {fields.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-ink/40 font-mono uppercase tracking-wider">
            merge fields
          </span>
          {fields.map((f) => (
            <span
              key={f}
              className="text-xs font-mono px-1.5 py-0.5 rounded bg-ink/5 text-ink/70"
            >
              {`{{${f}}}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
