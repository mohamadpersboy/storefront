import { Favorite } from "@/models/Favorite";
import { Product } from "@/models/Product";
import { AmazingOffer } from "@/models/AmazingOffer";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";
import {
  PRODUCT_CARD_FIELDS,
  buildColorsMap,
  isDisplayable,
  pickRepresentativeVariant,
  toProductCard,
  type LeanProductForCard,
} from "@/lib/storefront/homepage-products";
import type { ProductCardData } from "@/components/storefront/product-card";

export const FAVORITES_PAGE_SIZE = 12;

/**
 * صفحه‌بندی معتبر برای صفحه «علاقه‌مندی‌ها» — عدد نامعتبر (رشته/صفر/
 * منفی/اعشاری) همیشه به صفحه ۱ برمی‌گردد؛ رفتار مشابه در دیگر بخش‌های
 * پروژه معمولاً Inline پیاده شده، اینجا به یک تابع خالص و قابل تست
 * جدا شد چون این صفحه اولین Consumer پارامتر `page` در Storefront است.
 */
export function parseFavoritesPage(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}

export type FavoriteProductCards = {
  items: ProductCardData[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

/**
 * محصولات علاقه‌مندی‌های کاربر برای صفحه `/favorites` — جدیدترین
 * علاقه‌مندی اول (`createdAt` نزولی روی خودِ `Favorite`، نه روی
 * محصول). `total` روی تعداد کل ردیف‌های `Favorite` کاربر محاسبه
 * می‌شود (نه فقط ردیف‌های همین صفحه که هنوز محصول قابل‌نمایش دارند)؛
 * اگر محصولی بعد از افزودن به علاقه‌مندی‌ها حذف/غیرفعال شده باشد،
 * همان‌جا بی‌صدا از خروجی افتاده می‌شود (مثل رفتار Cart با محصول
 * غیرفعال) — ممکن است در نتیجه یک صفحه کمتر از `pageSize` آیتم واقعی
 * نشان دهد، اما هرگز یک محصول حذف‌شده را نمایش نمی‌دهد.
 */
export async function getFavoriteProductCards(
  userId: string,
  page: number,
  pageSize = FAVORITES_PAGE_SIZE,
): Promise<FavoriteProductCards> {
  const total = await Favorite.countDocuments({ user: userId });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const favorites = await Favorite.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((safePage - 1) * pageSize)
    .limit(pageSize)
    .select("product")
    .lean();

  const orderedProductIds = favorites.map((f) => String(f.product));
  if (orderedProductIds.length === 0) {
    return { items: [], total, page: safePage, pageSize, totalPages };
  }

  const products = (await Product.find({
    _id: { $in: orderedProductIds },
    status: "published",
    deletedAt: null,
  })
    .select(PRODUCT_CARD_FIELDS)
    .lean()) as unknown as LeanProductForCard[];

  const productsById = new Map(products.map((p) => [String(p._id), p]));
  // ترتیب واقعی علاقه‌مندی (جدیدترین اول) حفظ می‌شود؛ ترتیب برگشتی $in تضمین‌شده نیست.
  const orderedProducts = orderedProductIds
    .map((id) => productsById.get(id))
    .filter((p): p is LeanProductForCard => Boolean(p) && isDisplayable(p as LeanProductForCard));

  const colorsMap = await buildColorsMap(orderedProducts);

  // Amazing Offer فعال هر کدام از همین محصولات — طبق درخواست صریح
  // کارفرما («تخفیف‌های شگفت‌انگیز هم شامل بشه»)، قیمت/برچسب کارت
  // علاقه‌مندی باید همان تخفیف واقعی Offer فعال را نشان دهد، نه فقط
  // تخفیف عادی Variant. منطق کاملاً هم‌الگو با `getAmazingOfferProductCards`
  // در `homepage-products.ts` (بدون Duplicate).
  const now = new Date();
  const activeOffers = (await AmazingOffer.find({
    productId: { $in: orderedProducts.map((p) => p._id) },
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  }).lean()) as unknown as {
    productId: unknown;
    variantId: unknown;
    startAt: Date;
    endAt: Date;
    discountType: "percent" | "fixed";
    discountValue: number;
  }[];
  const offerByProductId = new Map(activeOffers.map((o) => [String(o.productId), o]));

  const items = orderedProducts
    .map((product) => {
      const offer = offerByProductId.get(String(product._id));
      const offerVariant = offer
        ? product.variants.find((v) => String(v._id) === String(offer.variantId))
        : undefined;

      if (offer && offerVariant) {
        const finalPrice = computeAmazingOfferPrice(
          offerVariant.price,
          offer.discountType,
          offer.discountValue,
        );
        return toProductCard(product, offerVariant, colorsMap, {
          startAt: offer.startAt.toISOString(),
          endAt: offer.endAt.toISOString(),
          finalPrice,
        });
      }

      const variant = pickRepresentativeVariant(product.variants);
      return variant ? toProductCard(product, variant, colorsMap, null) : null;
    })
    .filter((card): card is ProductCardData => card !== null);

  return { items, total, page: safePage, pageSize, totalPages };
}
