import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { markNotificationRead, viewerFromUser } from "@/lib/notifications/queries";

/** PATCH /api/v1/notifications/:id/read — فقط کاربر واردشده. */
export async function PATCH(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();

  const ok = await markNotificationRead(viewerFromUser(guard.user), id);
  if (!ok) return apiError("اعلان پیدا نشد", { status: 404 });

  return apiSuccess({ id, isRead: true });
}
