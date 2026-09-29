import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { connectToDatabase } from "@/lib/db/connect";
import { apiSuccess } from "@/lib/utils/api-response";
import { markAllNotificationsRead, viewerFromUser } from "@/lib/notifications/queries";

/**
 * PATCH /api/v1/notifications/read-all — فقط `notificationsSeenAt` را
 * جلو می‌برد؛ رکوردی برای تک‌تک اعلان‌ها ساخته/به‌روز نمی‌شود.
 */
export async function PATCH() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  await markAllNotificationsRead(viewerFromUser(guard.user));

  return apiSuccess({ count: 0 });
}
