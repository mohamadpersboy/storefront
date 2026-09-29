import { getCurrentUser } from "@/lib/auth/current-user";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { getVisibleNotification, viewerFromUser } from "@/lib/notifications/queries";

/**
 * GET /api/v1/notifications/:id — فقط اگر اعلان برای این بیننده قابل
 * مشاهده باشد. اعلان شخصیِ دیگران/Draft/منقضی برای همه ۴۰۴ است (وجود
 * آن‌ها لو نمی‌رود).
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectToDatabase();
  const user = await getCurrentUser();

  const notification = await getVisibleNotification({
    id,
    viewer: user ? viewerFromUser(user) : null,
  });
  if (!notification) return apiError("اعلان پیدا نشد", { status: 404 });

  const response = apiSuccess(notification);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
