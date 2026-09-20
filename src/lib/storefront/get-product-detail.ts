import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";
import { computeFinalPrice } from "@/lib/utils/pricing";
import { pickRepresentativeVariant } from "@/lib/storefront/homepage-products";
import type { ProductGalleryImage } from "@/components/storefront/product-image-gallery";

export type ProductDetailVariant = {
  id: string;
  unit: string;
  colorName: string | null;
  colorHex: string | null;
  attributes: { name: string; value: string }[];
  price: number;
  finalPrice: number;
  stock: number;
  isActive: boolean;
};

export type ProductDetailData = {
  id: string;
  title: string;
  images: ProductGalleryImage[];
  categoryName: string | null;
  /**
   * فعلاً فقط از فیلد واقعی `Product.description` — هرگز از
   * `technicalDescription`/`technicalSpecifications` (طبق دستور
   * صریح کارفرما: بخش توضیحات/ویژگی‌های فنی فعلاً طراحی نشود تا
   * دستور بعدی).
   */
  description: string | null;
  variants: ProductDetailVariant[];
  /** شناسه Variant نماینده (`pickRepresentativeVariant`) — انتخاب اولیه در Variant Selector. */
  defaultVariantId: string | null;
  /**
   * قیمت نمایشی اولیه — از همان Variant نماینده. بعد از انتخاب
   * کاربر در `ProductPurchasePanel`، قیمت نمایشی از روی خودِ
   * `variants` (Client-side) دوباره محاسبه می‌شود؛ این مقدار فقط
   * برای اولین Render (قبل از هر تعامل) است.
   */
  price: { basePrice: number; finalPrice: number } | null;
};

/** فیلدهای لازم برای این فاز. */
const PRODUCT_DETAIL_FIELDS = "title images variants description category";

type LeanCategoryRef = { _id: unknown; name: string } | null;
type LeanColorRef = { _id: unknown; name: string; hexCode: string } | null;

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
 *
 * **بدون «خاستگاه» (Origin):** برخلاف رفرنس میوه‌فروشی کارفرما، نه
 * `Product` و نه `Brand`/`Category` هیچ فیلد مکان/خاستگاهی ندارند —
 * پس این خط عمداً اضافه نشده (طبق همان اصل «داده نداریم، اختراع
 * نمی‌کنیم» که برای بخش توضیحات فنی هم رعایت شده).
 */
export async function getProductDetailBySlug(
  slug: string,
): Promise<ProductDetailData | null> {
  await connectToDatabase();

  const product = await Product.findOne({ slug, status: "published" })
    .select(PRODUCT_DETAIL_FIELDS)
    .populate<{ category: LeanCategoryRef }>({ path: "category", select: "name" })
    .populate<{ "variants.colorId": LeanColorRef }>({
      path: "variants.colorId",
      select: "name hexCode",
    })
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

  const variants: ProductDetailVariant[] = product.variants.map((variant) => {
    const color =
      variant.colorId && typeof variant.colorId === "object" && "hexCode" in variant.colorId
        ? (variant.colorId as unknown as LeanColorRef)
        : null;

    return {
      id: String(variant._id),
      unit: variant.unit,
      colorName: color?.name ?? null,
      colorHex: color?.hexCode ?? null,
      attributes: variant.attributes.map((attribute) => ({
        name: attribute.name,
        value: attribute.value,
      })),
      price: variant.price,
      finalPrice: computeFinalPrice(variant.price, variant.discountPercent, variant.discountAmount),
      stock: variant.stock,
      isActive: variant.isActive,
    };
  });

  const categoryRef =
    product.category && typeof product.category === "object" && "name" in product.category
      ? (product.category as unknown as LeanCategoryRef)
      : null;

  return {
    id: String(product._id),
    title: product.title,
    images: product.images.map((image) => ({
      url: image.url,
      blurDataUrl: null,
    })),
    categoryName: categoryRef?.name ?? null,
    description: product.description?.trim() || null,
    variants,
    defaultVariantId: representativeVariant ? String(representativeVariant._id) : null,
    price,
  };
}
