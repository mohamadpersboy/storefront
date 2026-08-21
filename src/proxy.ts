import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Re-enabled now that real OTP Authentication exists (Dashboard Backend
 * phase). Previously this was temporarily disabled at the user's
 * explicit request so the Dashboard UI could be reviewed without a
 * working login. That reason no longer applies — logging in now works
 * for real, so the optimistic check is back to protecting /dashboard.
 *
 * Optimistic-only check: redirects obviously-unauthenticated visitors
 * away from /dashboard before any page code runs. This is NOT the
 * authorization boundary — src/app/(dashboard)/dashboard/layout.tsx
 * (via getCurrentUser()) re-verifies the session and role server-side
 * on every request, because Proxy cannot be trusted as the sole
 * gatekeeper (see Next.js docs).
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/dashboard")) {
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
