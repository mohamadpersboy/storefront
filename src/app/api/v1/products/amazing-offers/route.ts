import type { NextRequest } from "next/server";
import type { PipelineStage, Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { AmazingOffer } from "@/models/AmazingOffer";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { storefrontProductsQuerySchema } from "@/lib/validations/storefront-products";
import { buildPublicProductSummary } from "@/lib/storefront/product-summary";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";

interface AggregatedVariant {
  _id: Types.ObjectId;
  price: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
}

interface AggregatedProduct {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  images: Array<{ url: string }>;
  variants: AggregatedVariant[];
  createdAt: Date;
}

interface AggregatedCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
}

/**
 * بدون Auth — بند ۶ سند Audit («فقط Offerهایی که در بازه زمانی معتبر
 * هستند»). بر خلاف `GET /api/v1/amazing-offers` داخل Dashboard (که
 * همه رکوردها را برای مدیریت نشان می‌دهد و نیازمند Auth است)، این
 * Route فقط Offerهای واقعاً «زنده» (`isActive` + داخل بازه
 * `startAt`/`endAt`) روی محصولات منتشرشده را برمی‌گرداند — همان تعریف
 * `getAmazingOfferStatus === "active"` که در Backend پرداخت/نمایش
 * Dashboard هم استفاده می‌شود، اینجا مستقیماً به‌عنوان شرط Query تکرار
 * شده تا فیلتر در سطح Database انجام شود، نه بعد از بارگذاری همه رکوردها.
 */
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

  const now = new Date();
  const pipeline: PipelineStage[] = [
    {
      $match: {
        isActive: true,
        startAt: { $lte: now },
        endAt: { $gte: now },
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
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
    { $sort: { endAt: 1 } }, // زودتر تمام‌شونده‌ها اول (فوریت خرید)
    {
      $facet: {
        data: [
          { $skip: (page - 1) * limit },
          { $limit: limit },
          {
            $project: {
              _id: 0,
              offerId: "$_id",
              variantId: 1,
              discountType: 1,
              discountValue: 1,
              startAt: 1,
              endAt: 1,
              product: 1,
              category: { $arrayElemAt: ["$category", 0] },
            },
          },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ];

  const [result] = await AmazingOffer.aggregate(pipeline);
  const totalDocs: number = result?.totalCount?.[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

  const items = (result?.data ?? []).map(
    (row: {
      offerId: unknown;
      variantId: unknown;
      discountType: "percent" | "fixed";
      discountValue: number;
      startAt: Date;
      endAt: Date;
      product: AggregatedProduct;
      category?: AggregatedCategory;
    }) => {
      const variant = row.product.variants.find(
        (v) => String(v._id) === String(row.variantId),
      );
      const summary = buildPublicProductSummary({
        _id: row.product._id,
        title: row.product.title,
        slug: row.product.slug,
        images: row.product.images,
        variants: row.product.variants,
        createdAt: row.product.createdAt,
        category: row.category ?? null,
      });

      return {
        offerId: String(row.offerId),
        product: summary,
        variantId: variant ? String(variant._id) : String(row.variantId),
        discountType: row.discountType,
        discountValue: row.discountValue,
        offerPrice: variant
          ? computeAmazingOfferPrice(variant.price, row.discountType, row.discountValue)
          : null,
        startAt: row.startAt,
        endAt: row.endAt,
      };
    },
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
