import mongoose, { type Types } from "mongoose";
import { Category } from "@/models/Category";

export interface ResolvedCategory {
  id: string;
  name: string;
  slug: string;
}

/**
 * جایگزین امن `populate("category")` — عمداً از Mongoose `populate`
 * استفاده نمی‌کند چون اگر حتی یک سند Product در DB مقدار `category`
 * نامعتبر داشته باشد (مثلاً یک رشته متنی باقی‌مانده از داده تستی
 * قدیمی، نه یک ObjectId واقعی)، `populate` هنگام Cast کردن آن به
 * ObjectId یک Exception می‌اندازد و کل درخواست (نه فقط همان یک محصول)
 * را Crash می‌کند — دقیقاً همان چیزی که در Production رخ داد
 * (`CastError` روی مقدار `"vegetable"`).
 *
 * این تابع به‌جای آن، ابتدا فقط شناسه‌های *واقعاً معتبر* را جدا
 * می‌کند، فقط همان‌ها را از Category می‌خواند، و برای هر Product مقدار
 * Category را دستی وصل می‌کند — یک شناسه خراب فقط باعث می‌شود همان
 * محصول `category: null` نشان داده شود، نه اینکه کل لیست از کار
 * بیفتد.
 */
export async function resolveProductCategories(
  categoryRefs: Array<Types.ObjectId | string | null | undefined>,
): Promise<Map<string, ResolvedCategory>> {
  const validIds = [
    ...new Set(
      categoryRefs
        .map((c) => (c ? String(c) : null))
        .filter((id): id is string => Boolean(id) && mongoose.isValidObjectId(id)),
    ),
  ];

  if (validIds.length === 0) return new Map();

  const categories = await Category.find({ _id: { $in: validIds } })
    .select("name slug")
    .lean();

  return new Map(
    categories.map((c) => [
      String(c._id),
      { id: String(c._id), name: c.name, slug: c.slug },
    ]),
  );
}
