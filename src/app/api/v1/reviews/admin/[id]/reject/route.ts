import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { logActivity } from "@/lib/audit/log-activity";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { moderateReview } from "@/lib/reviews/service";
import { rejectReviewSchema } from "@/lib/validations/reviews";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.REVIEWS_MANAGE);
  if (guard.response) return guard.response;

  // Body اختیاری است (دلیل رد اختیاری)؛ Body خراب = بدون دلیل نیست، ۴۲۲.
  const raw = await request.text();
  let json: unknown = {};
  if (raw.trim()) {
    try {
      json = JSON.parse(raw);
    } catch {
      return apiError("اطلاعات وارد شده نامعتبر است", { status: 422 });
    }
  }
  const parsed = rejectReviewSchema.safeParse(json ?? {});
  if (!parsed.success) {
    return apiError("اطلاعات وارد شده نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { id } = await params;
  await connectToDatabase();
  const result = await moderateReview({
    reviewId: id,
    to: "rejected",
    moderatorId: guard.user.id,
    rejectionReason: parsed.data.rejectionReason,
  });
  if (!result.ok) return apiError(result.message, { status: result.status });

  await logActivity({
    actor: guard.user,
    action: "review.rejected",
    targetType: "Review",
    targetId: result.data.id,
    description: "نظر رد شد",
  });
  return apiSuccess({ id: result.data.id, status: result.data.status }, { message: "نظر رد شد" });
}
