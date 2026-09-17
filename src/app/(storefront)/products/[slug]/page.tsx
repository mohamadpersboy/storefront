import { notFound } from "next/navigation";
import { getProductDetailBySlug } from "@/lib/storefront/get-product-detail";
import { ProductTopBar } from "@/components/storefront/product-top-bar";
import { ProductImageGallery } from "@/components/storefront/product-image-gallery";
import { ProductInfoHeader } from "@/components/storefront/product-info-header";

type ProductDetailPageProps = {
  params: Promise<{ slug: string }>;
};

/**
 * صفحه جزئیات محصول — Phase 1 (Top Bar + Gallery) + Phase 2 (عنوان +
 * قیمت).
 *
 * طبق دستور صریح («Do NOT design or implement: ... Variants,
 * Attributes, Add to cart, Wishlist, Product description, Related
 * products, Reviews»)، بقیهٔ محتوای این صفحه عمداً اینجا نیست و در
 * ماژول‌های بعدی اضافه می‌شود.
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
      <ProductInfoHeader title={product.title} price={product.price} />
    </div>
  );
}
