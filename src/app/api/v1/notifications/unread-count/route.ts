import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { apiSuccess } from "@/lib/utils/api-response";
import { countUnreadNotifications, viewerFromUser } from "@/lib/notifications/queries";

/** GET /api/v1/notifications/unread-count — Guest همیشه ۰ (Read State ندارد). */
export async function GET() {
  await connectToDatabase();
  const user = await getCurrentUser();
  const count = user ? await countUnreadNotifications(viewerFromUser(user)) : 0;

  // `authenticated` به UI می‌گوید Read State (علامت‌گذاری) در دسترس است.
  const response = apiSuccess({ count, authenticated: Boolean(user) });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
