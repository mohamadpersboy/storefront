import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { computeFinalPrice } from "@/lib/utils/pricing";
import { pickRepresentativeVariant } from "@/lib/storefront/homepage-products";
import type { ProductGalleryImage } from "@/components/storefront/product-image-gallery";

export type ProductDetailData = {
  id: string;
  title: string;
  images: ProductGalleryImage[];
  /**
   * قیمت نمایشی — از ارزان‌ترین Variant فعال/موجود محاسبه می‌شود
   * (`pickRepresentativeVariant`، همان تابع صفحه اصلی). انتخاب واقعی
   * Variant توسط کاربر خودش یک ماژول جداست (خارج از Scope همین فاز)؛
   * تا آن زمان این عدد فقط یک قیمت شروع/نماینده است.
   *
   * وقتی محصول هیچ Variant قابل‌نمایشی نداشته باشد (نباید در عمل رخ
   * دهد چون هر محصول حداقل یک Variant لازم دارد، اما محافظه‌کارانه
   * مدیریت شده)، `null` است — Component باید این حالت را جداگانه
   * مدیریت کند.
   */
  price: { basePrice: number; finalPrice: number } | null;
};

/** فیلدهای لازم برای این فاز (Top Bar + Gallery + Title/Price). */
const PRODUCT_DETAIL_FIELDS = "title images variants";

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

  const representativeVariant = pickRepresentativeVariant(product.variants);
  const price = representativeVariant
    ? {
        basePrice: representativeVariant.price,
        finalPrice: computeFinalPrice(
          representativeVariant.price,
          representativeVariant.discountPercent,
          representativeVariant.discountAmount,
        ),
      }
    : null;

  return {
    id: String(product._id),
    title: product.title,
    images: product.images.map((image) => ({
      url: image.url,
      blurDataUrl: null,
    })),
    price,
  };
}
