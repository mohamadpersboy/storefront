import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { logActivity } from "@/lib/audit/log-activity";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { getAdminReviewDetail } from "@/lib/reviews/queries";
import { adminDeleteReview } from "@/lib/reviews/service";
import { toAdminReviewDetailDTO, type LeanReview } from "@/lib/reviews/serialize";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.REVIEWS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();
  const doc = (await getAdminReviewDetail(id)) as unknown as LeanReview | null;
  if (!doc) return apiError("نظر پیدا نشد", { status: 404 });

  return apiSuccess(toAdminReviewDetailDTO(doc));
}

/** DELETE — Soft Delete توسط Admin/Super Admin. */
export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.REVIEWS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();
  const result = await adminDeleteReview(id);
  if (!result.ok) return apiError(result.message, { status: result.status });

  await logActivity({
    actor: guard.user,
    action: "review.deleted",
    targetType: "Review",
    targetId: result.data.id,
    description: "نظر توسط مدیر حذف شد",
  });
  return apiSuccess({ id: result.data.id }, { message: "نظر حذف شد" });
}
