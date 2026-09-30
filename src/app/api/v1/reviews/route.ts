import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createReview } from "@/lib/reviews/service";
import { createReviewSchema } from "@/lib/validations/reviews";

/**
 * POST /api/v1/reviews — ثبت نظر (کاربر Login‌شده).
 * `status`/`isVerifiedBuyer`/`order`/`moderatedBy`/`deletedAt` از Body
 * خوانده نمی‌شوند؛ Zod فیلدهای ناشناخته را دور می‌ریزد.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createReviewSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات وارد شده نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const result = await createReview(guard.user.id, parsed.data);
  if (!result.ok) {
    return apiError(result.message, { status: result.status, errors: result.errors });
  }

  return apiSuccess(
    { id: result.data.id, status: result.data.status, isVerifiedBuyer: result.data.isVerifiedBuyer },
    { status: 201, message: "نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود" },
  );
}
