import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type GeneratedVariant = {
  subject: string;
  body: string;
  axis: string;
};

const FALLBACK_INITIAL_VARIANTS: GeneratedVariant[] = [
  {
    subject: "One change that doubled our open rate",
    body: "We rewrote our subject lines around a single number — and watched opens climb 2.1x in a week. Here's the playbook (and the spreadsheet).",
    axis: "stronger subject line",
  },
  {
    subject: "Closing the doors at midnight",
    body: "Founding-member pricing ends tonight. After that, the next tier kicks in and the spots are gone. If you've been thinking about it, this is the moment.",
    axis: "more urgency",
  },
  {
    subject: "Quick question before you go",
    body: "Got 90 seconds? I'd love your take on what we're building — even one sentence helps. Hit reply, no formality required.",
    axis: "different CTA framing",
  },
];

const FALLBACK_REPLACEMENT_VARIANTS: GeneratedVariant[] = [
  {
    subject: "The number that changed everything",
    body: "Subject lines with a specific number outperformed vague ones 3-to-1 in our latest cohort. Here's the data and the exact templates we're using now.",
    axis: "specificity in headline",
  },
  {
    subject: "Last 6 hours",
    body: "The founding round closes at midnight. Six spots left, no extensions. If you've been on the fence, now's the call.",
    axis: "tighter time pressure",
  },
];

const SYSTEM_PROMPT = `You are an expert email copywriter. You generate variants of marketing emails that explore different conversion strategies. You always respond with valid JSON only — no preamble, no markdown fences, no commentary. The JSON must be a top-level array.`;

function buildInitialPrompt(baseline: string): string {
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

function buildReplacementPrompt(winner: string, count: number): string {
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

function extractJsonArray(text: string): unknown {
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

function validateVariants(parsed: unknown, expectedCount: number): GeneratedVariant[] {
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

async function callClaude(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");
  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: prompt }],
  });
  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("No text content in response");
  }
  return textBlock.text;
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const params = (body ?? {}) as Record<string, unknown>;
  const action = params.action;

  if (action === "generate_variants") {
    const baseline = typeof params.baseline === "string" ? params.baseline : "";
    if (!baseline.trim()) {
      return NextResponse.json({ error: "Missing baseline" }, { status: 400 });
    }
    try {
      const text = await callClaude(buildInitialPrompt(baseline));
      const parsed = extractJsonArray(text);
      const variants = validateVariants(parsed, 3);
      return NextResponse.json({ variants, source: "llm" });
    } catch (err) {
      console.error("[demo] generate_variants failed:", err);
      return NextResponse.json({
        variants: FALLBACK_INITIAL_VARIANTS,
        source: "fallback",
      });
    }
  }

  if (action === "generate_replacement_variants") {
    const winner = typeof params.winner === "string" ? params.winner : "";
    const requestedCount =
      typeof params.count === "number" && Number.isFinite(params.count)
        ? Math.max(1, Math.min(4, Math.floor(params.count)))
        : 2;
    if (!winner.trim()) {
      return NextResponse.json({ error: "Missing winner" }, { status: 400 });
    }
    try {
      const text = await callClaude(buildReplacementPrompt(winner, requestedCount));
      const parsed = extractJsonArray(text);
      const variants = validateVariants(parsed, requestedCount);
      return NextResponse.json({ variants, source: "llm" });
    } catch (err) {
      console.error("[demo] generate_replacement_variants failed:", err);
      return NextResponse.json({
        variants: FALLBACK_REPLACEMENT_VARIANTS.slice(0, requestedCount),
        source: "fallback",
      });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
