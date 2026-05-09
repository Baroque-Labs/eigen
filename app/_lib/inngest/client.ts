// Singleton Inngest client. Functions live in app/_lib/inngest/functions/
// and are wired into the serve handler at app/api/inngest/route.ts.
//
// In local dev `npx inngest-cli@latest dev` runs an Inngest dev server
// at http://localhost:8288 that auto-discovers /api/inngest. No keys
// needed locally. In production set INNGEST_EVENT_KEY and
// INNGEST_SIGNING_KEY (from the Inngest dashboard) so events publish
// and webhook signatures verify.

import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "eigen",
  name: "Eigen",
  // Dev mode tells the SDK to talk to the local Inngest dev server
  // (default http://localhost:8288) and skip the signing-key check.
  // In production NODE_ENV is "production" and Inngest demands the
  // signing key, which is what we want.
  isDev: process.env.NODE_ENV === "development",
});
