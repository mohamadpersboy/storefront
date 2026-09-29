import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { listVisibleNotifications, viewerFromUser } from "@/lib/notifications/queries";
import { notificationsListQuerySchema } from "@/lib/validations/notifications";

/**
 * GET /api/v1/notifications — عمومی برای Guest (فقط اعلان عمومی)؛
 * برای کاربر واردشده عمومی + شخصیِ خودش. هیچ‌وقت Cache عمومی نمی‌شود
 * (پاسخ به Session وابسته است؛ درستی مهم‌تر از Cache است).
 */
export async function GET(request: NextRequest) {
  const parsed = notificationsListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return apiError("پارامترهای درخواست نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const user = await getCurrentUser();
  const { items, pagination } = await listVisibleNotifications({
    viewer: user ? viewerFromUser(user) : null,
    page: parsed.data.page,
    limit: parsed.data.limit,
  });

  const response = apiSuccess(items, { pagination });
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
