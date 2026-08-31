import type { NextRequest } from "next/server";
import type { PipelineStage, Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { storefrontProductsQuerySchema } from "@/lib/validations/storefront-products";
import { buildPublicProductSummary } from "@/lib/storefront/product-summary";

interface AggregatedProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  images: Array<{ url: string }>;
  variants: Array<{ price: number; discountPercent: number; discountAmount: number; stock: number }>;
  createdAt: Date;
}

interface AggregatedCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

/**
 * بدون Auth — بند ۶ سند Audit («محاسبه بر اساس اطلاعات واقعی
 * Orderها... معیار باید مشخص و قابل توسعه باشد»). معیار فعلی: مجموع
 * `quantity` فروخته‌شده هر محصول در تمام سفارش‌هایی که لغو یا مرجوع
 * نشده‌اند (`cancelled`/`returned` مستثنی هستند چون فروش واقعی
 * محسوب نمی‌شوند). این تعریف در یک آرایه (`EXCLUDED_STATUSES`) نگه‌
 * داشته می‌شود تا تغییر معیار در آینده (مثلاً محدود به بازه زمانی
 * خاص) فقط یک تغییر کوچک در همین فایل باشد.
 */
const EXCLUDED_STATUSES = ["cancelled", "returned"];

export async function GET(request: NextRequest) {
  const parsed = storefrontProductsQuerySchema.safeParse({
    page: request.nextUrl.searchParams.get("page") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return apiError("پارامترهای صفحه‌بندی معتبر نیستند", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { page, limit } = parsed.data;
  await connectToDatabase();

  const pipeline: PipelineStage[] = [
    { $match: { status: { $nin: EXCLUDED_STATUSES } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", totalSold: { $sum: "$items.quantity" } } },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product",
      },
    },
    { $unwind: "$product" },
    { $match: { "product.status": "published", "product.deletedAt": null } },
    {
      $lookup: {
        from: "categories",
        localField: "product.category",
        foreignField: "_id",
        as: "category",
      },
    },
    { $sort: { totalSold: -1 } },
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              totalSold: 1,
              product: 1,
              category: { $arrayElemAt: ["$category", 0] },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await Order.aggregate(pipeline);
  const totalDocs: number = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

  const items = (result?.data ?? []).map(
    (row: { product: AggregatedProduct; category?: AggregatedCategory; totalSold: number }) => ({
      ...buildPublicProductSummary({
        _id: row.product._id,
        title: row.product.title,
        slug: row.product.slug,
        images: row.product.images,
        variants: row.product.variants,
        createdAt: row.product.createdAt,
        category: row.category ?? null,
      }),
      totalSold: row.totalSold,
    }),
  );

  return apiSuccess(items, {
    pagination: {
      totalDocs,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
