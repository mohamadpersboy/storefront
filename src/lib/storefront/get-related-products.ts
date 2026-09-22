import { Types } from "mongoose";
import { Product } from "@/models/Product";
import { Order } from "@/models/Order";
import {
  PRODUCT_CARD_FIELDS,
  buildColorsMap,
  isDisplayable,
  toDisplayableCards,
  type LeanProductForCard,
} from "@/lib/storefront/homepage-products";
import type { ProductCardData } from "@/components/storefront/product-card";

const OVER_FETCH_MULTIPLIER = 3;

/**
 * «محصولات مشابه» صفحه محصول — رتبه‌بندی بر اساس شباهت *عنوان* به
 * محصول فعلی (طبق دستور صریح کارفرما)، نه دسته‌بندی/برند مشترک.
 * از Text Index مونگو روی `Product.title` استفاده می‌کند
 * (`ProductSchema.index({ title: "text" })`) و با امتیاز
 * `$meta: "textScore"` مرتب می‌شود — بالاترین امتیاز یعنی
 * بیشترین همپوشانی کلمات با عنوان محصول فعلی.
 *
 * **باگ رفع‌شده (خطای سرور واقعی گزارش‌شده روی همین صفحه بعد از
 * Deploy):** Text Index تازه (بالا) روی یک Collection که از قبل
 * داده دارد، توسط خودِ Mongoose در پس‌زمینه ساخته می‌شود
 * (`autoIndex` پیش‌فرض `true`)، نه فوری. اولین درخواست‌هایی که
 * درست همان لحظه اول (قبل از تمام‌شدن ساخت Index) به این تابع
 * می‌رسند، با خطای مونگو «text index required for $text query» رد
 * می‌شوند. رفع شد با `await Product.init()` — یک Promise که مطابق
 * مستندات خودِ Mongoose دقیقاً وقتی Resolve می‌شود که ساخت Index
 * (اگر در حال انجام باشد) تمام شده باشد؛ صدازدن چندبارهٔ آن (هر
 * درخواست) بی‌خطر و تقریباً بی‌هزینه است (بعد از اولین بار، از
 * Cache داخلی خودِ Mongoose بلافاصله Resolve می‌شود).
 *
 * حداکثر ۱۰ محصول، بدون دکمه «مشاهده بیشتر» (طبق دستور صریح
 * کارفرما — نگاه کنید `RelatedProductsCarousel`، بدون `seeAllHref`).
 */
export async function getSimilarProductCards(
  currentProductId: string,
  currentTitle: string,
  limit = 10,
): Promise<ProductCardData[]> {
  await Product.init();

  const results = await Product.find(
    {
      _id: { $ne: new Types.ObjectId(currentProductId) },
      status: "published",
      $text: { $search: currentTitle },
    },
    { score: { $meta: "textScore" } },
  )
    .sort({ score: { $meta: "textScore" } })
    .limit(limit * OVER_FETCH_MULTIPLIER)
    .select(PRODUCT_CARD_FIELDS)
    .lean();

  const products = results as unknown as LeanProductForCard[];
  const displayable = products.filter(isDisplayable).slice(0, limit);
  const colorsMap = await buildColorsMap(displayable);

  return toDisplayableCards(displayable, colorsMap);
}

/**
 * «همراه با این محصول خریده شده است» — بر اساس Orderهای واقعی
 * (نه Mock): محصولاتی که در همان سفارش‌هایی بوده‌اند که این محصول
 * هم در آن‌ها بوده، مرتب‌شده بر اساس تعداد سفارش‌های مشترک. هم‌الگو
 * با `getBestSellerProductCards` در `homepage-products.ts`
 * (Aggregate روی `Order`، سفارش‌های لغوشده/مرجوعی حذف).
 *
 * حداکثر ۱۰ محصول، بدون دکمه «مشاهده بیشتر».
 */
export async function getFrequentlyBoughtTogetherCards(
  currentProductId: string,
  limit = 10,
): Promise<ProductCardData[]> {
  const objectId = new Types.ObjectId(currentProductId);

  const coOccurrences = await Order.aggregate<{ _id: Types.ObjectId; orderCount: number }>([
    { $match: { status: { $nin: ["cancelled", "returned"] }, "items.product": objectId } },
    { $unwind: "$items" },
    { $match: { "items.product": { $ne: objectId } } },
    { $group: { _id: "$items.product", orderCount: { $sum: 1 } } },
    { $sort: { orderCount: -1 } },
    { $limit: limit * OVER_FETCH_MULTIPLIER },
  ]);

  if (coOccurrences.length === 0) return [];

  const orderedIds = coOccurrences.map((c) => String(c._id));
  const results = (await Product.find({
    _id: { $in: orderedIds },
    status: "published",
  })
    .select(PRODUCT_CARD_FIELDS)
    .lean()) as unknown as LeanProductForCard[];

  const byId = new Map(results.map((p) => [String(p._id), p]));
  const inCoOccurrenceOrder = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is LeanProductForCard => p !== undefined && isDisplayable(p))
    .slice(0, limit);

  const colorsMap = await buildColorsMap(inCoOccurrenceOrder);

  return toDisplayableCards(inCoOccurrenceOrder, colorsMap);
}
