import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * ⚠️ TEMPORARILY DISABLED (by explicit user request) so /dashboard can be
 * reviewed visually before real Auth is built. DO NOT leave this disabled
 * past the Dashboard UI review step — re-enable before Dashboard Backend /
 * Integration work begins. See CLAUDE.md → "Known Issues".
 *
 * Safety guard: this only skips the check when it is NOT a real
 * Production deployment. We check `VERCEL_ENV` rather than `NODE_ENV`
 * because Vercel always sets NODE_ENV=production during `next build`
 * for every deployment — including Preview builds for feature branches.
 * `VERCEL_ENV` is the value that actually distinguishes "production"
 * from "preview"/"development". Locally (no VERCEL_ENV) it falls back
 * to NODE_ENV. Bottom line: a real production deploy on the primary
 * domain can never accidentally ship with an open /dashboard.
 *
 * Optimistic-only check: redirects obviously-unauthenticated visitors
 * away from /dashboard before any page code runs. This is NOT the
 * authorization boundary — every dashboard route/server action must
 * still re-verify the session and permission server-side, because
 * Proxy cannot be trusted as the sole gatekeeper (see Next.js docs).
 */
const isRealProduction =
  (process.env.VERCEL_ENV ?? process.env.NODE_ENV) === "production";
const AUTH_CHECK_DISABLED = !isRealProduction;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
    return NextResponse.next();
  }

  if (AUTH_CHECK_DISABLED) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.role === "customer") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/dashboard/:path*",
};
