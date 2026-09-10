import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";
import { apiSuccess } from "@/lib/utils/api-response";

/**
 * برخلاف `/api/v1/categories` (که برای مدیریت کامل در Dashboard است
 * و نیاز به `CATEGORIES_READ` دارد)، این یک Route عمومی و سبک
 * مخصوص Storefront است — فقط دسته‌بندی‌های سطح اول، فعال، و علامت‌
 * خورده برای «نمایش در صفحه اصلی» را برمی‌گرداند. هم‌الگو با
 * `/api/v1/products/latest` و مشابه آن‌ها (GET بدون Auth، برای
 * مصرف مستقیم در صفحه اصلی).
 */
export async function GET() {
  await connectToDatabase();

  const categories = await Category.find({
    parentId: null,
    isActive: true,
    showOnHomepage: true,
  })
    .sort({ sortOrder: 1, createdAt: 1 })
    .lean();

  return apiSuccess(
    categories.map((c) => ({
      id: String(c._id),
      name: c.name,
      slug: c.slug,
      imageUrl: c.imageUrl,
      imageBlurDataUrl: c.imageBlurDataUrl,
    })),
  );
}
