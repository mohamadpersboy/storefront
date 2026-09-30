import { Types } from "mongoose";
import { Review } from "@/models/Review";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import "@/models/Order";
import type { AdminReviewsListQuery } from "@/lib/validations/reviews";

/**
 * تنها تعریف «Review قابل نمایش در Storefront»: approved + حذف‌نشده.
 * Storefront آینده فقط باید از همین فیلتر/سرویس استفاده کند.
 */
export function publicVisibleReviewFilter(productId?: string): Record<string, unknown> {
  const filter: Record<string, unknown> = { status: "approved", deletedAt: null };
  if (productId) filter.product = new Types.ObjectId(productId);
  return filter;
}

export async function listApprovedReviews(params: { productId: string; page: number; limit: number }) {
  return Review.paginate(publicVisibleReviewFilter(params.productId), {
    page: params.page,
    limit: params.limit,
    sort: { createdAt: -1, _id: -1 },
    lean: true,
  });
}

export interface ProductReviewStats {
  averageRating: number;
  ratingCount: number;
  recommendCount: number;
  verifiedBuyerCount: number;
}

/** محاسبه هنگام Query (بدون Denormalization)؛ فقط approved + حذف‌نشده. */
export async function getProductReviewStats(productId: string): Promise<ProductReviewStats> {
  const [row] = await Review.aggregate<{
    avg: number;
    count: number;
    recommend: number;
    verified: number;
  }>([
    { $match: publicVisibleReviewFilter(productId) },
    {
      $group: {
        _id: null,
        avg: { $avg: "$rating" },
        count: { $sum: 1 },
        recommend: { $sum: { $cond: [{ $eq: ["$recommendation", "recommend"] }, 1, 0] } },
        verified: { $sum: { $cond: ["$isVerifiedBuyer", 1, 0] } },
      },
    },
  ]);
  if (!row) return { averageRating: 0, ratingCount: 0, recommendCount: 0, verifiedBuyerCount: 0 };
  return {
    averageRating: Math.round(row.avg * 10) / 10,
    ratingCount: row.count,
    recommendCount: row.recommend,
    verifiedBuyerCount: row.verified,
  };
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAdminReviews(query: AdminReviewsListQuery) {
  const filter: Record<string, unknown> = { deletedAt: null };
  if (query.status) filter.status = query.status;
  if (query.rating) filter.rating = query.rating;
  if (query.verified) filter.isVerifiedBuyer = query.verified === "true";
  if (query.product) filter.product = new Types.ObjectId(query.product);
  if (query.user) filter.user = new Types.ObjectId(query.user);

  if (query.search) {
    const rx = new RegExp(escapeRegex(query.search), "i");
    const [products, users] = await Promise.all([
      Product.find({ title: rx }).select("_id").limit(100).lean(),
      User.find({ $or: [{ fullName: rx }, { phoneNumber: rx }] }).select("_id").limit(100).lean(),
    ]);
    filter.$or = [
      { product: { $in: products.map((p) => p._id) } },
      { user: { $in: users.map((u) => u._id) } },
    ];
  }

  return Review.paginate(filter, {
    page: query.page,
    limit: query.limit,
    sort: { createdAt: -1, _id: -1 },
    lean: true,
    populate: [
      { path: "product", select: "title slug" },
      { path: "user", select: "fullName phoneNumber" },
    ],
  });
}

export async function getAdminReviewDetail(id: string) {
  if (!Types.ObjectId.isValid(id)) return null;
  return Review.findOne({ _id: id, deletedAt: null })
    .populate([
      { path: "product", select: "title slug" },
      { path: "user", select: "fullName phoneNumber" },
      { path: "moderatedBy", select: "fullName phoneNumber" },
      { path: "order", select: "orderNumber" },
    ])
    .lean();
}
