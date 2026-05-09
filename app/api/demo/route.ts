import { NextRequest, NextResponse } from "next/server";
import { callClaude } from "./_claude";
import {
  FALLBACK_INITIAL_VARIANTS,
  FALLBACK_REPLACEMENT_VARIANTS,
} from "./_fallbacks";
import { extractJsonArray, validateVariants } from "./_parse";
import { buildInitialPrompt, buildReplacementPrompt } from "./_prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
