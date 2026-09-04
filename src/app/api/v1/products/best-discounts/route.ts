import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { storefrontProductsQuerySchema } from "@/lib/validations/storefront-products";
import { buildPublicProductSummary } from "@/lib/storefront/product-summary";
import { resolveProductCategories } from "@/lib/products/resolve-categories";

/**
 * بدون Auth — بند ۶ سند Audit («بیشترین تخفیف... بر اساس درصد تخفیف
 * مؤثر»). چون تخفیف می‌تواند Percent یا Amount ثابت باشد، «درصد مؤثر»
 * فقط بعد از محاسبه با قیمت واقعی هر Variant مشخص می‌شود — این محاسبه
 * در Mongo Aggregation ساده نیست، پس با یک Query فیلترشده (فقط
 * محصولاتی که واقعاً حداقل یک Variant تخفیف‌دار دارند) کاندیدها را
 * محدود می‌کنیم و مرتب‌سازی نهایی/Pagination در همین لایه انجام می‌شود.
 *
 * ⚠️ نکته بهینه‌سازی برای آینده (یادداشت در CLAUDE.md): اگر تعداد
 * محصولات دارای تخفیف در آینده خیلی زیاد شد، بهتر است هنگام ذخیره
 * Product یک فیلد denormalized مثل `maxDiscountPercent` روی خود سند
 * نگه‌داری و Index شود تا نیازی به بارگذاری کامل کاندیدها در Memory
 * نباشد.
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

  const candidates = await Product.find({
    status: "published",
    deletedAt: null,
    $or: [
      { "variants.discountPercent": { $gt: 0 } },
      { "variants.discountAmount": { $gt: 0 } },
    ],
  })
    // ⚠️ عمداً populate نمی‌کنیم — نگاه کنید توضیح در
    // src/lib/products/resolve-categories.ts.
    .lean();

  const categoryMap = await resolveProductCategories(candidates.map((p) => p.category));

  const summaries = candidates
    .map((p) =>
      buildPublicProductSummary({
        ...p,
        category: categoryMap.get(String(p.category)) ?? null,
      }),
    )
    .filter((s) => s.maxDiscountPercent > 0)
    .sort((a, b) => b.maxDiscountPercent - a.maxDiscountPercent);

  const totalDocs = summaries.length;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));
  const start = (page - 1) * limit;
  const pageItems = summaries.slice(start, start + limit);

  return apiSuccess(pageItems, {
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
