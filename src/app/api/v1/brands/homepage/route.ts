import { connectToDatabase } from "@/lib/db/connect";
import { Brand } from "@/models/Brand";
import { apiSuccess } from "@/lib/utils/api-response";

/**
 * برخلاف `/api/v1/brands` (که برای مدیریت کامل در Dashboard است و
 * نیاز به `BRANDS_READ` دارد)، این یک Route عمومی و سبک مخصوص
 * Storefront است — فقط برندهای فعال و علامت‌خورده برای «نمایش در
 * صفحه اصلی» را برمی‌گرداند. هم‌الگو با `/api/v1/categories/homepage`
 * (GET بدون Auth، برای مصرف مستقیم در صفحه اصلی).
 */
export async function GET() {
  await connectToDatabase();

  const brands = await Brand.find({
    isActive: true,
    showOnHomepage: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return apiSuccess(
    brands.map((b) => ({
      id: String(b._id),
      name: b.name,
      slug: b.slug,
      imageUrl: b.imageUrl,
      imageBlurDataUrl: b.imageBlurDataUrl,
    })),
  );
}
