// Claude prompts for the demo's variant generator. Edit copy here to tune
// generation behavior — the route handler dispatches to these by action.

export const SYSTEM_PROMPT = `You are an expert email copywriter. You generate variants of marketing emails that explore different conversion strategies. You always respond with valid JSON only — no preamble, no markdown fences, no commentary. The JSON must be a top-level array.`;

export function buildInitialPrompt(baseline: string): string {
  return `Here is a baseline marketing email:

---
${baseline}
---

Generate exactly 3 variants of this email. Each variant must explore a meaningfully DIFFERENT axis from the others — for example: one with a stronger/more specific subject line, one with greater urgency or scarcity, one with a different CTA framing or tonal register. Make the variants substantively distinct so an A/B/C/D test would actually show different conversion rates — don't just rephrase.

Each variant should be plausible to send to real subscribers. Keep bodies to 1-3 sentences.

Respond with ONLY a JSON array of exactly 3 objects, each with this shape:
[
  {"subject": "...", "body": "...", "axis": "short label describing what makes this variant different"},
  ...
]

The "axis" field must be a short lowercase label (3-6 words) like "stronger subject line", "more urgency", "different cta framing", "softer tone", "specificity over abstraction", etc.

Return only the JSON array. No other text.`;
}

export function buildReplacementPrompt(winner: string, count: number): string {
  return `Here is the current winning marketing email:

---
${winner}
---

Generate exactly ${count} fresh variants seeded by this winner. Each variant should mutate the winner along a DIFFERENT axis — try things like a sharper subject line, more urgency, a different CTA, a different opener, etc. Don't be too conservative — exploration is the point. Each variant should be plausibly better OR worse than the seed; we want real signal.

Each variant should be plausible to send to real subscribers. Keep bodies to 1-3 sentences.

Respond with ONLY a JSON array of exactly ${count} objects, each with this shape:
[
  {"subject": "...", "body": "...", "axis": "short label describing what makes this variant different"},
  ...
]

The "axis" field must be a short lowercase label (3-6 words).

Return only the JSON array. No other text.`;
}
