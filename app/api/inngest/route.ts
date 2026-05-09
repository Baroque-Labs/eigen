// Inngest's HTTP entrypoint. The Inngest cloud (or local dev server)
// hits this URL to discover functions and dispatch events.
//
// proxy.ts already excludes /api/* from the auth gate — Inngest's
// signing key is what authenticates this surface in prod.

import { serve } from "inngest/next";
import { inngest } from "@/app/_lib/inngest/client";
import { functions } from "@/app/_lib/inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
});
