// Markdown → HTML pipeline shared by the composer preview (client)
// and the per-recipient send job (server). Merge fields like
// {{first_name}} are substituted AFTER markdown render with HTML-
// escaped values, so a recipient name with markdown-meaningful chars
// (`*`, `_`, `[`, etc.) renders literally instead of becoming italic
// or a link. Server-side callers also run the result through
// DOMPurify; the client preview skips DOMPurify because the source
// is the user's own content and markdown-it's html:false already
// escapes any raw HTML they typed.

import MarkdownIt from "markdown-it";

const md = new MarkdownIt({
  html: false,        // raw HTML in source is escaped, not rendered
  linkify: true,      // bare URLs become links
  breaks: true,       // single newlines → <br> (matches email expectations)
  typographer: true,  // smart quotes, dashes
});

const MERGE_FIELD_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g;

export type MergeValues = Record<string, string>;

export type RenderOptions = {
  // Server-only — pass DOMPurify (or undefined to skip).
  // The client preview path leaves this undefined.
  // We accept the function rather than importing DOMPurify here
  // because pulling isomorphic-dompurify into the client bundle
  // would add ~50kb for content the user already typed themselves.
  sanitize?: (html: string) => string;
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function extractMergeFields(source: string): string[] {
  const seen = new Set<string>();
  for (const match of source.matchAll(MERGE_FIELD_RE)) {
    seen.add(match[1]);
  }
  return [...seen];
}

export function renderMarkdown(
  source: string,
  values: MergeValues = {},
  opts: RenderOptions = {},
): string {
  const html = md.render(source);
  const substituted = html.replace(MERGE_FIELD_RE, (_, name: string) => {
    const v = values[name];
    return v == null ? `{{${name}}}` : escapeHtml(v);
  });
  return opts.sanitize ? opts.sanitize(substituted) : substituted;
}

// Plain-text fallback for the multipart/alternative `text` field on
// emails. Strips merge-field-substituted markdown to bare text so
// plain-text mail clients see something readable. Naive but fine for
// v1 — markdown source is mostly already plain-text-shaped.
export function renderPlainText(source: string, values: MergeValues = {}): string {
  return source.replace(MERGE_FIELD_RE, (_, name: string) => {
    const v = values[name];
    return v == null ? `{{${name}}}` : v;
  });
}
