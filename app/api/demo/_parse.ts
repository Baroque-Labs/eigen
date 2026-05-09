export type GeneratedVariant = {
  subject: string;
  body: string;
  axis: string;
};

export function extractJsonArray(text: string): unknown {
  const trimmed = text.trim();
  // Strip markdown fences if present
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  // Find the first '[' and last ']' to be lenient with stray prose
  const start = candidate.indexOf("[");
  const end = candidate.lastIndexOf("]");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON array found in model response");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

export function validateVariants(
  parsed: unknown,
  expectedCount: number,
): GeneratedVariant[] {
  if (!Array.isArray(parsed)) throw new Error("Response is not an array");
  if (parsed.length < expectedCount) {
    throw new Error(`Expected ${expectedCount} variants, got ${parsed.length}`);
  }
  const out: GeneratedVariant[] = [];
  for (let i = 0; i < expectedCount; i++) {
    const v = parsed[i];
    if (!v || typeof v !== "object") throw new Error(`Variant ${i} not an object`);
    const obj = v as Record<string, unknown>;
    const subject = typeof obj.subject === "string" ? obj.subject : "";
    const body = typeof obj.body === "string" ? obj.body : "";
    const axis = typeof obj.axis === "string" ? obj.axis : "alternative phrasing";
    if (!subject || !body) throw new Error(`Variant ${i} missing subject or body`);
    out.push({ subject, body, axis });
  }
  return out;
}
