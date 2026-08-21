import { SignJWT, jwtVerify } from "jose";
import type { Role } from "@/lib/constants/rbac";

export const SESSION_COOKIE_NAME = "km_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30; // 30 days

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
