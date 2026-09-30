import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { deleteOwnReview } from "@/lib/reviews/service";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/v1/reviews/:id — حذف (Soft) نظر خودِ کاربر؛ نظر دیگران ۴۰۴. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();
  const result = await deleteOwnReview(guard.user.id, id);
  if (!result.ok) return apiError(result.message, { status: result.status });

  return apiSuccess({ id: result.data.id }, { message: "نظر شما حذف شد" });
}
