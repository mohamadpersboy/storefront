import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import type { ProductGalleryImage } from "@/components/storefront/product-image-gallery";

export type ProductDetailData = {
  id: string;
  title: string;
  images: ProductGalleryImage[];
};

/** فقط فیلدهای لازم برای فاز فعلی (Top Bar + Gallery) — `select()` شده تا از Over-fetch جلوگیری شود. */
const PRODUCT_DETAIL_FIELDS = "title images";

/**
 * محصول منتشرشده را با `slug` می‌خواند — مستقیم از DB (نه از
 * `/api/v1/products` که Route داشبوردی و Authorization-Protected
 * است)، هم‌الگو با بقیهٔ صفحات Storefront (`homepage-products.ts`).
 *
 * فقط محصول `status: "published"` برگردانده می‌شود؛ محصولات Draft/
 * Archived برای بازدیدکننده باید مثل موجودنبودن باشند (۴۰۴)، نه
 * نمایش داده شوند.
 *
 * `imageBlurDataUrl` فعلاً برای هیچ تصویر محصولی وجود ندارد (برخلاف
 * Banner/Category) — مدل `Product.images` این فیلد را ندارد. پس
 * همیشه `null` برمی‌گردد؛ خودِ `ProductImageGallery` به‌جای Mesh
 * Blur واقعی از یک Placeholder سبک استفاده می‌کند. افزودن این فیلد
 * به مدل + جریان آپلود Dashboard یک تصمیم معماری جداست (خارج از
 * Scope همین فاز).
 */
export async function getProductDetailBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  await connectToDatabase();

  const product = await Product.findOne({ slug, status: "published" })
    .select(PRODUCT_DETAIL_FIELDS)
    .lean();

  if (!product) return null;

  return {
    id: String(product._id),
    title: product.title,
    images: product.images.map((image) => ({
      url: image.url,
      blurDataUrl: null,
    })),
  };
}
