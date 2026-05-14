// DEV-BYPASS proxy for local-network demos. Rewrites root paths under
// /app/* without Clerk and without host-based routing.

import { NextResponse, type NextRequest } from "next/server";

export default function devProxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // Map bare /campaigns, /settings, /domains to /app/*
  if (
    pathname === "/" ||
    pathname.startsWith("/campaigns") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/domains")
  ) {
    const url = req.nextUrl.clone();
    url.pathname = `/app${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
