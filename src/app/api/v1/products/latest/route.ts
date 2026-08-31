import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Product, type IProduct } from "@/models/Product";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { storefrontProductsQuerySchema } from "@/lib/validations/storefront-products";
import { buildPublicProductSummary } from "@/lib/storefront/product-summary";

type LeanProduct = IProduct & {
  _id: Types.ObjectId;
  category: { _id: Types.ObjectId; name: string; slug: string } | Types.ObjectId;
};

/**
 * بدون Auth — API عمومی Storefront (بند ۶ سند Audit). فقط محصولات
 * `published` و حذف‌نشده (`deletedAt: null`) برگردانده می‌شوند؛ Index
 * موجود روی `createdAt` (از زمان طراحی اولیه Product) کافی است و
 * Collection Scan اضافه نمی‌کند.
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

  const result = await Product.paginate(
    { status: "published", deletedAt: null },
    {
      page,
      limit,
      sort: { createdAt: -1 },
      populate: { path: "category", select: "name slug" },
      lean: true,
    },
  );

  return apiSuccess((result.docs as LeanProduct[]).map((p) => buildPublicProductSummary(p)), {
    pagination: {
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page ?? page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    },
  });
}
