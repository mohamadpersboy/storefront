import { notFound } from "next/navigation";
import { Sparkles, PackagePlus } from "lucide-react";
import { getProductDetailBySlug } from "@/lib/storefront/get-product-detail";
import { getIsProductFavorited } from "@/lib/storefront/get-is-favorite";
import { getMockWeeklyPriceHistory } from "@/lib/storefront/get-price-history";
import {
  getSimilarProductCards,
  getFrequentlyBoughtTogetherCards,
} from "@/lib/storefront/get-related-products";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProductTopBar } from "@/components/storefront/product-top-bar";
import { ProductAmazingOfferBanner } from "@/components/storefront/product-amazing-offer-banner";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductInfoHeader } from "@/components/storefront/product-info-header";
import { ProductPurchasePanel } from "@/components/storefront/product-purchase-panel";
import { ProductDescriptionCard } from "@/components/storefront/product-description-card";
import { ProductTechnicalSpecsCard } from "@/components/storefront/product-technical-specs-card";
import { RelatedProductsCarousel } from "@/components/storefront/related-products-carousel";
import { ProductTechnicalNotes } from "@/components/storefront/product-technical-notes";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * صفحه جزئیات محصول.
 *
 * فازهای قبلی: Top Bar + Gallery (Phase 1)، عنوان + قیمت (Phase 2)،
 * دکمه‌های علاقه‌مندی/نمودار قیمت در Top Bar، پنل خرید + توضیحات +
 * جدول ویژگی‌های محصول (دستورهای صریح بعدی).
 *
 * این فاز (طبق دستور دقیق بعدی کارفرما):
 * - `ProductInfoHeader` گسترش یافت: Chip دسته‌بندی حالا لینک‌شده به
 *   `/categories/{slug}` است (نه فقط متن)، با پشتیبانی از دو سطح
 *   دسته‌بندی (والد + خودش، کنار هم)؛ Chip برند («برند: نام») هم
 *   اضافه شد.
 * - `ProductVariantSelector` دیگر حتی با یک Variant هم مخفی نمی‌شود
 *   (اصلاح باگ — آن Pill تنها جای نمایش واحد فروش بود).
 * - عنوان جدول ویژگی‌ها از «ویژگی‌های فنی» به «ویژگی‌های محصول»
 *   تغییر کرد.
 * - دو ردیف محصول مرتبط (`RelatedProductsCarousel`، هم‌ساختار با
 *   ردیف‌های صفحه اصلی، بدون دکمه «مشاهده بیشتر»، حداکثر ۱۰
 *   محصول): «محصولات مشابه» (بر اساس شباهت *عنوان*،
 *   `getSimilarProductCards`) و «همراه با این محصول خریده شده
 *   است» (بر اساس هم‌سفارشی واقعی در Orderها،
 *   `getFrequentlyBoughtTogetherCards`).
 * - `ProductTechnicalNotes`: فقط اگر `Product.technicalDescription`
 *   (متن آزاد، جدا از `description` و از جدول ویژگی‌ها) مقدار
 *   داشته باشد — یک خط ساده بدون بک‌گراند، «ملاحظات فنی: …»، در
 *   انتهای صفحه.
 *
 * عمداً هنوز اینجا نیست: نظرات/ریتینگ — کارفرما گفت این‌ها فاز
 * جداگانه‌اند (فقط «محصولات مشابه» و «دیگران خریده‌اند» را همین حالا
 * خواست، نه نظرات/ریتینگ).
 *
 * **نکته مهم دربارهٔ Chip دسته‌بندی:** مقصد `/categories/{slug}`
 * هنوز در Storefront ساخته نشده — نگاه کنید یادداشت در
 * `ProductInfoHeader`.
 *
 * **افزوده‌شده طبق دستور صریح بعدی کارفرما:** اگر همین محصول همین
 * الان یک Amazing Offer فعال داشته باشد (`product.amazingOffer` از
 * `get-product-detail.ts`، با همان `getActiveAmazingOffersByProductId`
 * مشترک بقیه صفحات)، برچسب «پیشنهاد شگفت‌انگیز» + تایمر
 * (`ProductAmazingOfferBanner`) بالای گالری تصاویر نمایش داده
 * می‌شود؛ در غیر این صورت این بخش اصلاً رندر نمی‌شود (برخلاف
 * `ProductCard` که برای هم‌ترازی ردیف با `invisible` فضا رزرو
 * می‌کند — اینجا نیازی به آن نیست چون این صفحه تک‌محصولی است).
 *
 * **باگ رفع‌شده (خطای سرور واقعی گزارش‌شده روی همین صفحه):** دو
 * Query ردیف‌های محصول مرتبط با `Promise.allSettled` (نه
 * `Promise.all`) اجرا می‌شوند — یک خطای گذرا در هرکدام (مثلاً
 * Race توضیح‌داده‌شده در `getSimilarProductCards` درست بعد از هر
 * Deploy، قبل از تمام‌شدن ساخت Text Index تازه) دیگر کل صفحه را
 * پایین نمی‌کشد؛ فقط همان ردیف خالی می‌ماند (Log می‌شود، Throw
 * نمی‌شود). این دو ردیف تکمیلی‌اند، نه بخش حیاتی صفحه (گالری/قیمت/
 * افزودن به سبد)، پس نباید بتوانند کل Render را خراب کنند.
 *
 * `MobileBottomBar` سراسری در این صفحه با `StorefrontChrome` مخفی
 * می‌شود؛ به‌جایش `ProductAddToCartBar` نوار پایین چسبان اختصاصی
 * خودِ همین صفحه است (نگاه کنید `ProductPurchasePanel`).
 *
 * وضعیت اولیه علاقه‌مندی این‌جا (Server Component) با `getCurrentUser`
 * خوانده می‌شود تا دکمه از همان اولین Render درست باشد؛ تاریخچه قیمت
 * فعلاً MOCK است (نگاه کنید `getMockWeeklyPriceHistory`).
 *
 * `revalidate` عمداً تنظیم نشده (پیش‌فرض Dynamic) — چون این Route
 * پارامتری (`[slug]`) است.
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

  // این دو ردیف صرفاً تکمیلی‌اند — یک خطای گذرا در هرکدام (مثلاً
  // Race شرح‌داده‌شده در `getSimilarProductCards`) نباید کل صفحه
  // محصول (گالری، قیمت، افزودن به سبد) را از کار بیندازد. با
  // `allSettled` به‌جای `all`، خطای یکی مستقل از دیگری می‌ماند و در
  // بدترین حالت فقط همان ردیف خالی می‌شود (Component خودش با آرایه
  // خالی چیزی رندر نمی‌کند).
  const [similarProductsResult, boughtTogetherProductsResult] = await Promise.allSettled([
    getSimilarProductCards(product.id, product.title),
    getFrequentlyBoughtTogetherCards(product.id),
  ]);
  const similarProducts =
    similarProductsResult.status === "fulfilled" ? similarProductsResult.value : [];
  const boughtTogetherProducts =
    boughtTogetherProductsResult.status === "fulfilled" ? boughtTogetherProductsResult.value : [];
  if (similarProductsResult.status === "rejected") {
    console.error("getSimilarProductCards failed:", similarProductsResult.reason);
  }
  if (boughtTogetherProductsResult.status === "rejected") {
    console.error("getFrequentlyBoughtTogetherCards failed:", boughtTogetherProductsResult.reason);
  }

  return (
    <div className="pb-24">
      <ProductTopBar
        shareTitle={product.title}
        productId={product.id}
        initialIsFavorite={isFavorite}
        priceHistory={priceHistory}
      />
      {product.amazingOffer && <ProductAmazingOfferBanner offer={product.amazingOffer} />}
      <ProductImageGallery images={product.images} productTitle={product.title} />
      <ProductInfoHeader
        title={product.title}
        categories={product.categories}
        brandName={product.brandName}
      />
      <ProductPurchasePanel
        productId={product.id}
        variants={product.variants}
        defaultVariantId={product.defaultVariantId}
      />
      {product.description && <ProductDescriptionCard description={product.description} />}
      {product.technicalSpecifications.length > 0 && (
        <ProductTechnicalSpecsCard specs={product.technicalSpecifications} />
      )}
      <RelatedProductsCarousel
        title="محصولات مشابه"
        icon={Sparkles}
        iconBgClassName="bg-[var(--sf-accent-soft)]"
        iconColorClassName="text-[var(--sf-accent)]"
        items={similarProducts}
      />
      <RelatedProductsCarousel
        title="همراه با این محصول خریده شده است"
        icon={PackagePlus}
        iconBgClassName="bg-[var(--sf-accent-soft)]"
        iconColorClassName="text-[var(--sf-accent)]"
        items={boughtTogetherProducts}
      />
      {product.technicalDescription && (
        <ProductTechnicalNotes text={product.technicalDescription} />
      )}
    </div>
  );
}
