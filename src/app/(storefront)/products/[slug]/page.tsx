import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/storefront/get-product-detail";
import { getIsProductFavorited } from "@/lib/storefront/get-is-favorite";
import { getMockWeeklyPriceHistory } from "@/lib/storefront/get-price-history";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProductTopBar } from "@/components/storefront/product-top-bar";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductInfoHeader } from "@/components/storefront/product-info-header";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { ProductDescriptionCard } from "@/components/storefront/product-description-card";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * صفحه جزئیات محصول.
 *
 * فازهای قبلی: Top Bar + Gallery (Phase 1)، عنوان + قیمت (Phase 2)،
 * دکمه‌های علاقه‌مندی/نمودار قیمت در Top Bar (دستور صریح بعدی).
 *
 * این فاز: بقیه بخش‌های صفحه، مطابق رفرنس کارفرما (اسکرین‌شات یک
 * صفحه میوه‌فروشی) با تغییرات مرتبط با فرش — `ProductPurchasePanel`
 * (قیمت/موجودی + انتخاب Variant + Stepper تعداد + نوار پایین
 * چسبان افزودن به سبد، هر سه به `POST /api/v1/cart/items` واقعی
 * وصل) + `ProductDescriptionCard` (فقط اگر محصول توضیحات واقعی
 * داشته باشد).
 *
 * عمداً اینجا نیست (طبق دستور صریح کارفرما):
 * - توضیحات/ویژگی‌های فنی (`technicalDescription`/
 *   `technicalSpecifications`) — منتظر دستور بعدی.
 * - نظرات، ریتینگ، محصولات مشابه، «دیگران خریده‌اند» — فاز بعدی.
 * - «خاستگاه» رفرنس — هیچ فیلد معادلی در مدل فرش وجود ندارد.
 *
 * `MobileBottomBar` سراسری در این صفحه با `StorefrontChrome`
 * مخفی می‌شود؛ به‌جایش `ProductAddToCartBar` نوار پایین چسبان
 * اختصاصی خودِ همین صفحه است (نگاه کنید `ProductPurchasePanel`).
 *
 * وضعیت اولیه علاقه‌مندی این‌جا (Server Component) با `getCurrentUser`
 * خوانده می‌شود تا دکمه از همان اولین Render درست باشد؛ تاریخچه قیمت
 * فعلاً MOCK است (نگاه کنید `getMockWeeklyPriceHistory`).
 *
 * `revalidate` عمداً تنظیم نشده (پیش‌فرض Dynamic) — چون این Route
 * پارامتری (`[slug]`) است و صفحه اصلی هم با ISR ثابت (`revalidate =
 * 60`) کار می‌کند نه Dynamic per-request؛ برای این فاز حداقلی، تصمیم
 * Caching نهایی را به فازی موکول می‌کنیم که کل محتوای صفحه (و رفتار
 * مطلوب Stale-time آن) مشخص باشد.
 */
export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { slug } = await params;
  const product = await getProductDetailBySlug(slug);

  if (!product) {
    notFound();
  }

  const user = await getCurrentUser();
  const isFavorite = await getIsProductFavorited(user ? String(user._id) : null, product.id);
  const priceHistory = product.price
    ? getMockWeeklyPriceHistory(product.id, product.price.finalPrice)
    : [];

  return (
    <div>
      <ProductTopBar
        shareTitle={product.title}
        productId={product.id}
        initialIsFavorite={isFavorite}
        priceHistory={priceHistory}
      />
      <ProductImageGallery images={product.images} productTitle={product.title} />
      <ProductInfoHeader title={product.title} categoryName={product.categoryName} />
      <ProductPurchasePanel
        productId={product.id}
        variants={product.variants}
        defaultVariantId={product.defaultVariantId}
      />
      {product.description && <ProductDescriptionCard description={product.description} />}
    </div>
  );
}
