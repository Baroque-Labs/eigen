// Subdomain routing for the three Eigen surfaces:
//   eigentest.com         → marketing (root pages: /, /demo, /claim, ...)
//   app.eigentest.com     → dashboard, rewritten to /app/*
//   track.eigentest.com   → click redirect, rewritten to /track/*
//
// Auth: Clerk protects everything on the app host except sign-in /
// sign-up. Marketing and track hosts are public.
//
// EIGEN_DEV_BYPASS_CLERK=1 swaps Clerk for a no-op host-router so the app
// boots without Clerk keys. Used for local-network demos and the dev
// workspace fallback in app/_lib/auth/org.ts.
//
// Next 16 renamed `middleware.ts` → `proxy.ts` (same execution model).

import { NextResponse, type NextRequest } from "next/server";

const APP_HOST = process.env.NEXT_PUBLIC_APP_HOST ?? "app.eigentest.com";
const TRACK_HOST = process.env.NEXT_PUBLIC_TRACK_HOST ?? "track.eigentest.com";
const BYPASS = process.env.EIGEN_DEV_BYPASS_CLERK === "1";

function stripPort(host: string): string {
  const colon = host.indexOf(":");
  return colon === -1 ? host : host.slice(0, colon);
}

function rewriteToApp(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/app")) {
    const url = req.nextUrl.clone();
    url.pathname = `/app${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

function rewriteToTrack(req: NextRequest): NextResponse {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith("/track")) {
    const url = req.nextUrl.clone();
    url.pathname = `/track${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

// Dev-bypass: no Clerk import touched at runtime. Maps bare /campaigns,
// /settings, /domains to /app/* regardless of host so localhost:3000 works
// without setting up app.localhost.
function devProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.next();
  if (
    pathname === "/" ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/domains")
  ) {
    return rewriteToApp(req);
  }
  return NextResponse.next();
}

// Production middleware: Clerk-gated app host, public marketing + track.
// Lazy-construct so that turning BYPASS on means Clerk's module-level init
// (which fails without keys) is never touched.
function buildProdProxy() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { clerkMiddleware, createRouteMatcher } = require("@clerk/nextjs/server");
  const isPublicAppPath = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);
  return clerkMiddleware(async (auth: any, req: NextRequest) => {
  const host = stripPort(req.headers.get("host") ?? "").toLowerCase();
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) return NextResponse.next();

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
    return rewriteToApp(req);
  }
  if (isTrackHost) {
    return rewriteToTrack(req);
  }

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
}

export default BYPASS ? devProxy : buildProdProxy();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
