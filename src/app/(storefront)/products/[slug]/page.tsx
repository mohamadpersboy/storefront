import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/storefront/get-product-detail";
import { ProductTopBar } from "@/components/storefront/product-top-bar";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * صفحه جزئیات محصول — Phase 1: فقط Top Bar + Gallery تصویر.
 *
 * طبق دستور صریح («Do NOT design or implement: Product title,
 * Price, ... Any other Product Details modules»)، بقیهٔ محتوای این
 * صفحه (عنوان/قیمت/Variant/افزودن به سبد/توضیحات/محصولات مرتبط/
 * نظرات) عمداً اینجا نیست و در ماژول‌های بعدی اضافه می‌شود.
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

  return (
    <div>
      <ProductTopBar shareTitle={product.title} />
      <ProductImageGallery images={product.images} productTitle={product.title} />
    </div>
  );
}
