// Top-of-page link to the dashboard. In dev points to app.localhost,
// in production points to NEXT_PUBLIC_APP_HOST (default app.eigentest.com).
//
// We don't branch on auth state — Clerk redirects already-signed-in
// visitors from /sign-in straight to /campaigns, so a single link is
// the right UX and keeps the marketing page statically rendered.

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? "app.eigentest.com";
const APP_BASE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${APP_HOST}`
    : "http://app.localhost:3000";

export function SignInLink() {
  return (
    <a
      href={`${APP_BASE_URL}/sign-in`}
      className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink/60 hover:text-ink transition-colors"
    >
      Sign in →
    </a>
  );
}
