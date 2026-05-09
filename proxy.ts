// Subdomain routing for the three Eigen surfaces:
//   eigentest.com         → marketing (root pages: /, /demo, /claim, ...)
//   app.eigentest.com     → dashboard, rewritten to /app/*
//   track.eigentest.com   → click redirect, rewritten to /track/*
//
// Auth: Clerk protects everything on the app host except sign-in /
// sign-up. Marketing and track hosts are public.
//
// Next 16 renamed `middleware.ts` → `proxy.ts` (same execution model).
// In local dev `app.localhost` and `track.localhost` mirror the production
// subdomains; bare `localhost` lets you visit /app/... or /track/...
// directly. Production hosts can be overridden via NEXT_PUBLIC_APP_HOST
// and NEXT_PUBLIC_TRACK_HOST.

import {
  clerkMiddleware,
  createRouteMatcher,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? "app.eigentest.com";
const TRACK_HOST = process.env.NEXT_PUBLIC_TRACK_HOST ?? "track.eigentest.com";

// Public dashboard paths — Clerk's own auth screens. Everything else on
// the app host requires a signed-in user.
const isPublicAppPath = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
]);

function stripPort(host: string): string {
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

export default clerkMiddleware(async (auth, req) => {
  const host = stripPort(req.headers.get("host") ?? "").toLowerCase();
  const { pathname } = req.nextUrl;

  // /api/* always passes through to the route handler — no host
  // rewrite, no Clerk gate. Webhooks (Inngest, Resend, ...) reach us
  // here and authenticate via their own signature schemes. Per-route
  // user-facing APIs can still call auth() from @clerk/nextjs/server
  // and decide their own response if no user is signed in.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAppHost =
    host === APP_HOST.toLowerCase() || host === "app.localhost";
  const isTrackHost =
    host === TRACK_HOST.toLowerCase() || host === "track.localhost";
  const isLocalhost =
    host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1";

  if (isAppHost) {
    if (!isPublicAppPath(req)) {
      await auth.protect();
    }
    if (!pathname.startsWith("/app")) {
      const url = req.nextUrl.clone();
      url.pathname = `/app${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  if (isTrackHost) {
    if (!pathname.startsWith("/track")) {
      const url = req.nextUrl.clone();
      url.pathname = `/track${pathname === "/" ? "" : pathname}`;
      return NextResponse.rewrite(url);
    }
    return NextResponse.next();
  }

  // Marketing host (or anything else): in production, block direct
  // access to /app and /track so dashboard URLs don't leak through
  // eigentest.com. Skipped on localhost so devs can hit /app/*
  // directly without a Host header trick.
  if (
    !isLocalhost &&
    (pathname.startsWith("/app") || pathname.startsWith("/track"))
  ) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Everything except Next internals and static assets.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes.
    "/(api|trpc)(.*)",
    // Clerk's redirect callback URLs.
    "/__clerk/(.*)",
  ],
};
