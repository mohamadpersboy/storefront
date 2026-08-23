import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/constants/rbac";

export const SESSION_COOKIE_NAME = "km_session";
/**
 * 90 days. Note: session *duration* is rarely the actual reason a
 * person gets logged out repeatedly — the far more common cause on
 * Vercel is visiting a different deployment URL each time (every
 * push gets its own unique URL, e.g. cms-<hash>-user.vercel.app).
 * A cookie set on one host is NOT sent to a different host, so
 * hopping between per-deployment URLs looks exactly like "the
 * session keeps expiring" even though it hasn't. Always use the
 * stable Production domain (Vercel Project → Domains) for real use,
 * not the one-off deployment URL from a build log.
 */
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 90; // 90 days

export interface SessionPayload {
  userId: string;
  phoneNumber: string;
  role: Role;
}

function getSecretKey() {
  // Read lazily (not via src/config/env.ts) so this module stays importable
  // in the Edge runtime (proxy.ts), which validates env differently.
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (
      typeof payload.userId === "string" &&
      typeof payload.phoneNumber === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        userId: payload.userId,
        phoneNumber: payload.phoneNumber,
        role: payload.role as Role,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  name: SESSION_COOKIE_NAME,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_DURATION_SECONDS,
};
