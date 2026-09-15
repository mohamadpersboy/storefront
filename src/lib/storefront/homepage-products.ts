import type { Types } from "mongoose";
import { Product, type IProductVariant } from "@/models/Product";
import { Category } from "@/models/Category";
import { Color } from "@/models/Color";
import { AmazingOffer, type IAmazingOffer } from "@/models/AmazingOffer";
import { Order } from "@/models/Order";
import { computeFinalPrice } from "@/lib/utils/pricing";
import { computeAmazingOfferPrice } from "@/lib/utils/amazing-offer";
import type { ProductCardData } from "@/components/storefront/product-card";

/**
 * منبع واقعی داده برای سه ردیف محصول صفحه اصلی (شگفت‌انگیزها،
 * جدیدترین‌ها، پرفروش‌ترین‌ها) — قبلاً هرکدام Mock Data داخلی خودشان
 * را داشتند. طبق همان الگوی `page.tsx` برای Banner/Category/Brand:
 * این توابع مستقیماً از DB می‌خوانند (نه یک Fetch HTTP به API خودِ
 * پروژه) چون فقط داخل همین Server Component مصرف می‌شوند.
 */

type LeanProductForCard = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  images: { url: string }[];
  variants: IProductVariant[];
};

/**
 * از بین Variantهای فعال و موجود یک محصول، ارزان‌ترین (بعد از تخفیف
 * خودِ Variant) را برای نمایش روی کارت انتخاب می‌کند. اگر هیچ
 * Variant فعال/موجودی نداشت، به یک Variant فعال بدون موجودی و در
 * نهایت به اولین Variant محصول برمی‌گردد — تا محصول بدون Variant
 * قابل‌نمایش هرگز باعث خرابی کارت نشود.
 */
export function pickRepresentativeVariant(variants: IProductVariant[]): IProductVariant | null {
  if (variants.length === 0) return null;
  const inStock = variants.filter((v) => v.isActive && v.stock > 0);
  const active = variants.filter((v) => v.isActive);
  const pool = inStock.length > 0 ? inStock : active.length > 0 ? active : variants;

  return pool.reduce((cheapest, current) => {
    const currentPrice = computeFinalPrice(
      current.price,
      current.discountPercent,
      current.discountAmount,
    );
    const cheapestPrice = computeFinalPrice(
      cheapest.price,
      cheapest.discountPercent,
      cheapest.discountAmount,
    );
    return currentPrice < cheapestPrice ? current : cheapest;
  }, pool[0]);
}

/** رنگ‌های دیگر همین محصول (از روی Variantهای فعال دیگر) برای نقطه‌های رنگی روی کارت. */
async function buildColorsMap(
  products: { variants: IProductVariant[] }[],
): Promise<Map<string, { id: string; hexCode: string }>> {
  const colorIds = new Set<string>();
  for (const p of products) {
    for (const v of p.variants) {
      if (v.isActive && v.colorId) colorIds.add(String(v.colorId));
    }
  }
  if (colorIds.size === 0) return new Map();

  const colors = await Color.find({ _id: { $in: [...colorIds] } })
    .select("hexCode")
    .lean();

  return new Map(colors.map((c) => [String(c._id), { id: String(c._id), hexCode: c.hexCode }]));
}

function getProductColors(
  variants: IProductVariant[],
  colorsMap: Map<string, { id: string; hexCode: string }>,
): { id: string; hexCode: string }[] {
  const seen = new Set<string>();
  const result: { id: string; hexCode: string }[] = [];
  for (const v of variants) {
    if (!v.isActive || !v.colorId) continue;
    const key = String(v.colorId);
    if (seen.has(key)) continue;
    const color = colorsMap.get(key);
    if (color) {
      seen.add(key);
      result.push(color);
    }
  }
  return result;
}

function toProductCard(
  product: LeanProductForCard,
  variant: IProductVariant,
  colorsMap: Map<string, { id: string; hexCode: string }>,
  amazingOffer: { startAt: string; endAt: string; finalPrice: number } | null,
): ProductCardData {
  const basePrice = variant.price;
  const finalPrice = amazingOffer
    ? amazingOffer.finalPrice
    : computeFinalPrice(variant.price, variant.discountPercent, variant.discountAmount);

  return {
    id: String(product._id),
    product: {
      title: product.title,
      slug: product.slug,
      imageUrl: product.images[0]?.url ?? "",
      imageBlurDataUrl: null,
    },
    colors: getProductColors(product.variants, colorsMap),
    basePrice,
    finalPrice,
    amazingOffer: amazingOffer ? { startAt: amazingOffer.startAt, endAt: amazingOffer.endAt } : null,
  };
}

/** محصولاتی که حداقل یک تصویر و حداقل یک Variant قابل‌نمایش دارند. */
function isDisplayable(p: LeanProductForCard): boolean {
  return p.images.length > 0 && p.variants.length > 0;
}

/** تبدیل دسته‌ای محصولات به کارت — منطق مشترک هر سه ردیف/بخش این فایل. */
function toDisplayableCards(
  products: LeanProductForCard[],
  colorsMap: Map<string, { id: string; hexCode: string }>,
): ProductCardData[] {
  return products
    .map((p) => {
      const variant = pickRepresentativeVariant(p.variants);
      return variant ? toProductCard(p, variant, colorsMap, null) : null;
    })
    .filter((card): card is ProductCardData => card !== null);
}

/** «جدیدترین‌ها» — جدیدترین محصولات منتشرشده بر اساس تاریخ ایجاد. */
export async function getLatestProductCards(limit = 8): Promise<ProductCardData[]> {
  const products = (await Product.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("title slug images variants")
    .lean()) as unknown as LeanProductForCard[];

  const displayable = products.filter(isDisplayable);
  const colorsMap = await buildColorsMap(displayable);

  return toDisplayableCards(displayable, colorsMap);
}

/**
 * «پرفروش‌ترین‌ها» — بر اساس مجموع تعداد فروخته‌شدهٔ واقعی هر محصول
 * در Orderها محاسبه می‌شود (نه Mock)؛ سفارش‌های لغوشده/مرجوعی در
 * محاسبه در نظر گرفته نمی‌شوند. معیار فعلی: مجموع `quantity` تمام
 * آیتم‌های آن محصول در تمام سفارش‌های باقی‌مانده — در آینده قابل
 * تغییر به بازهٔ زمانی محدود (مثلاً ۳۰ روز اخیر) بدون تغییر در
 * ساختار خروجی این تابع.
 */
export async function getBestSellerProductCards(limit = 8): Promise<ProductCardData[]> {
  const bestSelling = await Order.aggregate<{ _id: Types.ObjectId; totalQuantity: number }>([
    { $match: { status: { $nin: ["cancelled", "returned"] } } },
    { $unwind: "$items" },
    { $group: { _id: "$items.product", totalQuantity: { $sum: "$items.quantity" } } },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit * 3 }, // Over-fetch: some products may since be unpublished/deleted/imageless.
  ]);

  if (bestSelling.length === 0) return [];

  const orderedIds = bestSelling.map((r) => String(r._id));
  const products = (await Product.find({
    _id: { $in: orderedIds },
    status: "published",
  })
    .select("title slug images variants")
    .lean()) as unknown as LeanProductForCard[];

  const byId = new Map(products.map((p) => [String(p._id), p]));
  const displayable = orderedIds
    .map((id) => byId.get(id))
    .filter((p): p is LeanProductForCard => p !== undefined && isDisplayable(p))
    .slice(0, limit);

  const colorsMap = await buildColorsMap(displayable);

  return toDisplayableCards(displayable, colorsMap);
}

type LeanAmazingOffer = IAmazingOffer & {
  _id: Types.ObjectId;
  productId: LeanProductForCard | Types.ObjectId | null;
};

/** «شگفت‌انگیزها» — فقط Offerهایی که همین الان فعال و در بازهٔ زمانی معتبرشان هستند. */
export async function getAmazingOfferProductCards(limit = 8): Promise<ProductCardData[]> {
  const now = new Date();
  const offers = (await AmazingOffer.find({
    isActive: true,
    startAt: { $lte: now },
    endAt: { $gte: now },
  })
    .sort({ endAt: 1 })
    .limit(limit)
    .populate({
      path: "productId",
      match: { status: "published" },
      select: "title slug images variants",
    })
    .lean()) as unknown as LeanAmazingOffer[];

  const withProduct = offers.filter(
    (o): o is LeanAmazingOffer & { productId: LeanProductForCard } =>
      !!o.productId && typeof o.productId === "object" && "variants" in o.productId,
  );
  const displayableOffers = withProduct.filter((o) => isDisplayable(o.productId));

  const colorsMap = await buildColorsMap(displayableOffers.map((o) => o.productId));

  return displayableOffers
    .map((offer) => {
      const product = offer.productId;
      const variant = product.variants.find((v) => String(v._id) === String(offer.variantId));
      if (!variant) return null;

      const finalPrice = computeAmazingOfferPrice(
        variant.price,
        offer.discountType,
        offer.discountValue,
      );

      return toProductCard(product, variant, colorsMap, {
        startAt: offer.startAt.toISOString(),
        endAt: offer.endAt.toISOString(),
        finalPrice,
      });
    })
    .filter((card): card is ProductCardData => card !== null);
}

export type CategoryProductSection = {
  id: string;
  name: string;
  slug: string;
  items: ProductCardData[];
};

type LeanCategory = { _id: Types.ObjectId; name: string; slug: string };
type LeanCategoryRef = { _id: Types.ObjectId; parentId: Types.ObjectId };

/**
 * هر دسته‌بندی سطح اول را به شناسهٔ خودش + شناسهٔ زیردسته‌های
 * مستقیمش نگاشت می‌کند — چون محصول می‌تواند به خودِ دسته اصلی *یا*
 * به یکی از زیردسته‌هایش متصل باشد (نگاه کنید فرم محصول، گزینه‌های
 * دارای پیشوند «⤷»)؛ عمق مجاز دسته‌بندی حداکثر ۲ سطح است، پس یک
 * سطح زیردسته برای پوشش کامل کافی است.
 */
export function buildCategoryIdGroups(
  rootIds: Types.ObjectId[],
  children: LeanCategoryRef[],
): Map<string, string[]> {
  const groups = new Map<string, string[]>(rootIds.map((id) => [String(id), [String(id)]]));
  for (const child of children) {
    const group = groups.get(String(child.parentId));
    if (group) group.push(String(child._id));
  }
  return groups;
}

/**
 * دسته‌بندی‌های سطح اول که در Dashboard هم «نمایش در صفحه اصلی» را
 * دارند و هم «اولویت نمایش» (`sortOrder`) آن‌ها دقیقاً صفر تنظیم
 * شده — طبق درخواست صریح کارفرما، هرکدام یک ردیف/کروسل محصول
 * مستقل مثل «پرفروش‌ترین‌ها»/«جدیدترین‌ها» به صفحه اصلی اضافه
 * می‌کند (محصولات آن دسته + زیردسته‌هایش، جدیدترین‌ها اول).
 * دسته‌ای که فعلاً هیچ محصول قابل‌نمایشی ندارد از خروجی حذف
 * می‌شود تا یک ردیف خالی رندر نشود.
 */
export async function getPriorityCategorySections(
  limitPerCategory = 8,
): Promise<CategoryProductSection[]> {
  const priorityCategories = (await Category.find({
    parentId: null,
    isActive: true,
    showOnHomepage: true,
    sortOrder: 0,
  })
    .sort({ createdAt: 1 })
    .select("name slug")
    .lean()) as unknown as LeanCategory[];

  if (priorityCategories.length === 0) return [];

  const rootIds = priorityCategories.map((c) => c._id);
  const children = (await Category.find({ parentId: { $in: rootIds } })
    .select("parentId")
    .lean()) as unknown as LeanCategoryRef[];

  const categoryIdGroups = buildCategoryIdGroups(rootIds, children);

  const sections = await Promise.all(
    priorityCategories.map(async (category) => {
      const categoryIds = categoryIdGroups.get(String(category._id)) ?? [String(category._id)];
      const products = (await Product.find({
        category: { $in: categoryIds },
        status: "published",
      })
        .sort({ createdAt: -1 })
        .limit(limitPerCategory)
        .select("title slug images variants")
        .lean()) as unknown as LeanProductForCard[];

      const displayable = products.filter(isDisplayable);
      const colorsMap = await buildColorsMap(displayable);

      return {
        id: String(category._id),
        name: category.name,
        slug: category.slug,
        items: toDisplayableCards(displayable, colorsMap),
      };
    }),
  );

  return sections.filter((section) => section.items.length > 0);
}
