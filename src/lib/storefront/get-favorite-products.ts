import { Favorite } from "@/models/Favorite";
import { Product } from "@/models/Product";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";
import { parsePageParam } from "@/lib/utils/pagination";
import {
  PRODUCT_CARD_FIELDS,
  buildColorsMap,
  getActiveAmazingOffersByProductId,
  isDisplayable,
  pickRepresentativeVariant,
  toProductCard,
  type LeanProductForCard,
} from "@/lib/storefront/homepage-products";
import type { ProductCardData } from "@/components/storefront/product-card";

export const FAVORITES_PAGE_SIZE = 12;

/**
 * صفحه‌بندی معتبر برای صفحه «علاقه‌مندی‌ها» — نام/امضای قبلی حفظ
 * شده (جای دیگری از آن Import می‌شود)، ولی منطق واقعی حالا در
 * `lib/utils/pagination.ts` مشترک است (هم `/orders` از همان استفاده
 * می‌کند، بدون Duplicate).
 */
export function parseFavoritesPage(raw: string | undefined): number {
  return parsePageParam(raw);
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
  // کارفرما («تخفیف‌های شگفت‌انگیز هم شامل بشه، هر جا کارتی وجود
  // داشته باشه»)، قیمت/برچسب کارت باید همان تخفیف واقعی Offer فعال
  // را نشان دهد، نه فقط تخفیف عادی Variant. حالا این Query یک
  // Helper مشترک در `homepage-products.ts` است — همان چیزی که
  // `toDisplayableCards` هم برای بقیه صفحات از آن استفاده می‌کند.
  const offerByProductId = await getActiveAmazingOffersByProductId(orderedProducts.map((p) => p._id));

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
