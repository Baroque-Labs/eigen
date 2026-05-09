// Server-only sanitizer wrapper. Imported by the send pipeline (and
// any other server code that ships rendered HTML to recipients).
// Kept separate from render.ts so the client preview can import the
// renderer without pulling DOMPurify into the browser bundle.

import "server-only";
import DOMPurify from "isomorphic-dompurify";

export function sanitizeEmailHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    // Email-safe defaults: keep target on links so they open in a new
    // tab from webmail clients, but require rel for security.
    ADD_ATTR: ["target", "rel"],
  });
}
