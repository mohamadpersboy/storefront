import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { logActivity } from "@/lib/audit/log-activity";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { moderateReview } from "@/lib/reviews/service";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.REVIEWS_MANAGE);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();
  const result = await moderateReview({ reviewId: id, to: "approved", moderatorId: guard.user.id });
  if (!result.ok) return apiError(result.message, { status: result.status });

  await logActivity({
    actor: guard.user,
    action: "review.approved",
    targetType: "Review",
    targetId: result.data.id,
    description: "نظر تأیید شد",
  });
  return apiSuccess({ id: result.data.id, status: result.data.status }, { message: "نظر تأیید شد" });
}
