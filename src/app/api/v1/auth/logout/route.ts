import { apiSuccess } from "@/lib/utils/api-response";
import { sessionCookieOptions } from "@/lib/auth/session";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.set(sessionCookieOptions.name, "", {
    ...sessionCookieOptions,
    maxAge: 0,
  });
  return response;
}
