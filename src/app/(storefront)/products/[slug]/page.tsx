import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/storefront/get-product-detail";
import { getIsProductFavorited } from "@/lib/storefront/get-is-favorite";
import { getMockWeeklyPriceHistory } from "@/lib/storefront/get-price-history";
import { getCurrentUser } from "@/lib/auth/current-user";
import { ProductTopBar } from "@/components/storefront/product-top-bar";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductInfoHeader } from "@/components/storefront/product-info-header";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * صفحه جزئیات محصول — Phase 1 (Top Bar + Gallery) + Phase 2 (عنوان +
 * قیمت) + دو دکمه Top Bar اضافه‌شده با دستور صریح بعدی (علاقه‌مندی +
 * نمودار قیمت).
 *
 * طبق دستور صریح فاز اول («Do NOT design or implement: ... Variants,
 * Attributes, Add to cart, Product description, Related products,
 * Reviews»)، بقیهٔ محتوای این صفحه عمداً اینجا نیست و در ماژول‌های
 * بعدی اضافه می‌شود. Wishlist از این محدودیت مستثنا شد چون کارفرما
 * صریحاً دکمه آن را (به‌عنوان بخشی از Top Bar) درخواست کرد.
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
      <ProductInfoHeader title={product.title} price={product.price} />
    </div>
  );
}
