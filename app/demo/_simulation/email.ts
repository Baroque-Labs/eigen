import type { Variant } from "../_types";

export function parseInputEmail(raw: string): { subject: string; body: string } {
  const text = raw.trim();
  const firstNewline = text.indexOf("\n");
  if (firstNewline === -1) return { subject: text.slice(0, 120), body: "" };
  let subject = text.slice(0, firstNewline).trim();
  const body = text.slice(firstNewline + 1).trim();
  // Strip "Subject:" prefix if present
  subject = subject.replace(/^subject:\s*/i, "").trim();
  return { subject, body };
}

export function variantToFullEmail(v: Variant): string {
  return `Subject: ${v.subject}\n\n${v.body}`;
}
