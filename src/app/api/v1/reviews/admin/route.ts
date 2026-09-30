import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { listAdminReviews } from "@/lib/reviews/queries";
import { toAdminReviewDTO, type LeanReview } from "@/lib/reviews/serialize";
import { adminReviewsListQuerySchema } from "@/lib/validations/reviews";

/** GET /api/v1/reviews/admin — لیست نظرات برای Dashboard. */
export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.REVIEWS_READ);
  if (guard.response) return guard.response;

  const parsed = adminReviewsListQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) {
    return apiError("پارامترهای درخواست نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const result = await listAdminReviews(parsed.data);

  return apiSuccess((result.docs as unknown as LeanReview[]).map(toAdminReviewDTO), {
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? parsed.data.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
}
