import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/db/connect";
import { User, type UserDocument } from "@/models/User";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth/session";

/**
 * Reads the session cookie (server-only — Server Components, Route
 * Handlers, Server Actions) and returns the full User document, or
 * null if there's no valid session. This is the real authorization
 * check — proxy.ts is only an optimistic redirect, not this.
 */
export async function getCurrentUser(): Promise<UserDocument | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) return null;

  const session = await verifySessionToken(token);
  if (!session) return null;

  await connectToDatabase();
  const user = await User.findById(session.userId);

  if (!user || !user.isActive) return null;

  return user;
}
