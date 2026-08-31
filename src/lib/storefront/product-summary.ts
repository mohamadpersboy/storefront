import { computeFinalPrice } from "@/lib/utils/pricing";

export interface PublicProductSummary {
  id: string;
  title: string;
  slug: string;
  category: { id: string; name: string; slug: string } | null;
  coverImage: string | null;
  /** کمترین قیمت نهایی (بعد از تخفیف) در میان Variantها */
  minPrice: number;
  /** قیمت پایه (قبل از تخفیف) همان Variant که minPrice از آن به دست آمده */
  originalPrice: number;
  /** بیشترین درصد تخفیف مؤثر در میان Variantها (۰ یعنی بدون تخفیف) */
  maxDiscountPercent: number;
  totalStock: number;
  createdAt: Date;
}

interface VariantLike {
  price: number;
  discountPercent: number;
  discountAmount: number;
  stock: number;
}

interface CategoryRefLike {
  _id: unknown;
  name: string;
  slug: string;
}

interface ProductLike {
  _id: unknown;
  title: string;
  slug: string;
  category: CategoryRefLike | unknown;
  images: Array<{ url: string }>;
  variants: VariantLike[];
  createdAt: Date;
}

/**
 * تابع خالص (بدون DB) که یک سند خام Product را به شکل عمومی
 * Storefront تبدیل می‌کند — در هر ۴ Endpoint این Task
 * (`amazing-offers`, `latest`, `best-selling`, `best-discounts`)
 * استفاده می‌شود تا شکل خروجی همه‌جا یکسان باشد. کاملاً قابل Unit Test
 * بدون نیاز به MongoDB واقعی.
 */
export function buildPublicProductSummary(product: ProductLike): PublicProductSummary {
  const variantStats = product.variants.map((v) => {
    const final = computeFinalPrice(v.price, v.discountPercent, v.discountAmount);
    const discountPercent =
      v.price > 0 ? Math.round(((v.price - final) / v.price) * 100) : 0;
    return { final, original: v.price, discountPercent };
  });

  const minPriceStat = variantStats.reduce<typeof variantStats[number] | null>((best, v) => {
    if (!best || v.final < best.final) return v;
    return best;
  }, null);

  const bestDiscount = variantStats.reduce(
    (best, v) => (v.discountPercent > best ? v.discountPercent : best),
    0,
  );

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);

  const categoryRef = product.category as CategoryRefLike | null | undefined;
  const category =
    categoryRef && typeof categoryRef === "object" && "name" in categoryRef
      ? { id: String(categoryRef._id), name: categoryRef.name, slug: categoryRef.slug }
      : null;

  return {
    id: String(product._id),
    title: product.title,
    slug: product.slug,
    category,
    coverImage: product.images[0]?.url ?? null,
    minPrice: minPriceStat?.final ?? 0,
    originalPrice: minPriceStat?.original ?? 0,
    maxDiscountPercent: bestDiscount,
    totalStock,
    createdAt: product.createdAt,
  };
}
