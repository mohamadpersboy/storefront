import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { getProductReviewStats, listApprovedReviews } from "@/lib/reviews/queries";
import {
  toPublicReviewDTO,
  toPublicReviewStats,
  type LeanPublicReview,
  type PublicReviewsPagination,
  type PublicReviewsResponseData,
} from "@/lib/reviews/public-serialize";

type LeanReviewWithUser = LeanPublicReview & { user: unknown };

/**
 * صفحه‌ای از Reviewهای قابل نمایش در Storefront. Visibility فقط از
 * `publicVisibleReviewFilter` (داخل `listApprovedReviews`) می‌آید.
 * محصول `draft`/حذف‌شده/ناموجود → `null` (Route آن را ۴۰۴ می‌کند)؛
 * `archived` مجاز است چون Reviewهای قدیمی آن همچنان دیده می‌شوند.
 */
export async function getPublicReviewsPage(params: {
  productId: string;
  page: number;
  limit: number;
}): Promise<{ data: PublicReviewsResponseData; pagination: PublicReviewsPagination } | null> {
  const product = await Product.findOne({
    _id: params.productId,
    status: { $in: ["published", "archived"] },
  })
    .select("_id")
    .lean();
  if (!product) return null;

  const [result, stats] = await Promise.all([
    listApprovedReviews(params),
    getProductReviewStats(params.productId),
  ]);

  const docs = result.docs as unknown as LeanReviewWithUser[];
  const userIds = [...new Set(docs.map((d) => String(d.user)))];
  const users = userIds.length
    ? await User.find({ _id: { $in: userIds } })
        .select("fullName")
        .lean()
    : [];
  const nameById = new Map(users.map((u) => [String(u._id), u.fullName]));

  return {
    data: {
      items: docs.map((d) => toPublicReviewDTO(d, nameById.get(String(d.user)))),
      stats: toPublicReviewStats(stats),
    },
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? params.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  };
}
