import type { Types } from "mongoose";
import { Product } from "@/models/Product";
import { Category } from "@/models/Category";
import { Brand } from "@/models/Brand";
import {
  buildCategoryIdGroups,
  buildColorsMap,
  isDisplayable,
  PRODUCT_CARD_FIELDS,
  PRIORITY_OVER_FETCH_MULTIPLIER,
  sortByPriority,
  toDisplayableCards,
  type LeanProductForCard,
} from "@/lib/storefront/homepage-products";
import type { ProductCardData } from "@/components/storefront/product-card";
import type { CategoryAttributeFilter, CategorySortValue } from "@/lib/validations/storefront-category-products";

/**
 * لایه Data صفحات `/categories` و `/categories/[slug]` — همه‌چیز
 * مستقیماً روی Model کار می‌کند (نه Fetch به API خودِ پروژه)، دقیقاً
 * هم‌الگو با `homepage-products.ts` (نگاه کنید توضیح آن فایل: چون
 * فقط داخل Server Component همین Storefront مصرف می‌شود، یک API
 * عمومی موازی برایش لازم نیست).
 */

export type LeanCategoryLite = { id: string; name: string; slug: string };

// ---------------------------------------------------------------------------
// دسته‌بندی‌های سطح اول (صفحه اصلی دسته‌بندی‌ها) + بخش محصول هرکدام
// ---------------------------------------------------------------------------

export type CategorySection = {
  id: string;
  name: string;
  slug: string;
  items: ProductCardData[];
};

/** همه دسته‌های سطح اول *فعال* — برخلاف Homepage، محدود به `showOnHomepage` نیست. */
export async function getActiveRootCategories(): Promise<LeanCategoryLite[]> {
  const categories = (await Category.find({ parentId: null, isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name slug")
    .lean()) as unknown as { _id: Types.ObjectId; name: string; slug: string }[];

  return categories.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug }));
}

/**
 * برای هر دسته‌بندی سطح اول فعال (نه فقط آن‌هایی که «نمایش در صفحه
 * اصلی» دارند)، محصولات آن دسته + زیردسته‌هایش را برمی‌گرداند —
 * منطق اشتراکی با `getPriorityCategorySections` از همان
 * Helperهای صادرشده استفاده می‌کند تا کد Duplicate نشود. دسته‌ای که
 * فعلاً محصول قابل‌نمایشی ندارد از خروجی حذف می‌شود (بند صریح
 * درخواست: «اگر یک دسته‌بندی محصولی ندارد، بخش خالی نمایش داده
 * نشود»).
 */
export async function getAllRootCategorySections(limitPerCategory = 10): Promise<CategorySection[]> {
  const roots = (await Category.find({ parentId: null, isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name slug")
    .lean()) as unknown as { _id: Types.ObjectId; name: string; slug: string }[];

  if (roots.length === 0) return [];

  const rootIds = roots.map((c) => c._id);
  const children = (await Category.find({ parentId: { $in: rootIds } })
    .select("parentId")
    .lean()) as unknown as { _id: Types.ObjectId; parentId: Types.ObjectId }[];

  const categoryIdGroups = buildCategoryIdGroups(rootIds, children);

  const sections = await Promise.all(
    roots.map(async (category) => {
      const categoryIds = categoryIdGroups.get(String(category._id)) ?? [String(category._id)];
      const products = (await Product.find({
        category: { $in: categoryIds },
        status: "published",
      })
        .sort({ createdAt: -1 })
        .limit(limitPerCategory * PRIORITY_OVER_FETCH_MULTIPLIER)
        .select(PRODUCT_CARD_FIELDS)
        .lean()) as unknown as LeanProductForCard[];

      const displayable = sortByPriority(products.filter(isDisplayable), (p) => p.sortOrder).slice(
        0,
        limitPerCategory,
      );
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

// ---------------------------------------------------------------------------
// صفحه اختصاصی یک دسته‌بندی
// ---------------------------------------------------------------------------

export type CategoryWithSubcategories = {
  id: string;
  name: string;
  slug: string;
  subcategories: LeanCategoryLite[];
};

/** `null` یعنی دسته‌ای با این Slug (سطح اول و فعال) پیدا نشد → صفحه باید `notFound()` کند. */
export async function getCategoryWithSubcategories(
  slug: string,
): Promise<CategoryWithSubcategories | null> {
  const category = (await Category.findOne({ slug, parentId: null, isActive: true })
    .select("name slug")
    .lean()) as unknown as { _id: Types.ObjectId; name: string; slug: string } | null;

  if (!category) return null;

  const children = (await Category.find({ parentId: category._id, isActive: true })
    .sort({ sortOrder: 1, createdAt: 1 })
    .select("name slug")
    .lean()) as unknown as { _id: Types.ObjectId; name: string; slug: string }[];

  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    subcategories: children.map((c) => ({ id: String(c._id), name: c.name, slug: c.slug })),
  };
}

export type CategoryFacets = {
  brands: { id: string; name: string; slug: string }[];
  /** هر ویژگی (مثلاً «شانه») + مقادیر متمایزش («۷۰۰»، «۱۰۰۰»، ...) که واقعاً روی محصولات همین دسته دیده شده. */
  attributes: { name: string; values: string[] }[];
};

const faCollator = new Intl.Collator("fa");

/**
 * گزینه‌های واقعاً قابل‌انتخاب فیلتر (برند/ویژگی) — فقط از روی
 * محصولات *منتشرشده* همین دسته (+ زیردسته‌ها) استخراج می‌شوند، نه
 * از کل Database (بند صریح درخواست: «تمام برندهای دیتابیس را بدون
 * توجه به دسته‌بندی نمایش نده»). عمداً بر اساس همان فیلترهای فعلی
 * کاربر (برند/ویژگی/قیمت انتخاب‌شده) دوباره محدود نمی‌شود — تا با
 * تغییر یک فیلتر، بقیه گزینه‌های فیلتر از لیست ناپدید نشوند.
 */
export async function getCategoryFacets(categoryIds: string[] | null): Promise<CategoryFacets> {
  const baseMatch: Record<string, unknown> = {
    status: "published",
    "images.0": { $exists: true },
  };
  if (categoryIds) baseMatch.category = { $in: categoryIds };

  const [brandRows, attributeRows] = await Promise.all([
    Product.aggregate<{ _id: Types.ObjectId }>([
      { $match: { ...baseMatch, brand: { $ne: null } } },
      { $group: { _id: "$brand" } },
    ]),
    Product.aggregate<{ _id: { name: string; value: string } }>([
      { $match: baseMatch },
      { $unwind: "$variants" },
      { $match: { "variants.isActive": true } },
      { $unwind: "$variants.attributes" },
      {
        $group: {
          _id: { name: "$variants.attributes.name", value: "$variants.attributes.value" },
        },
      },
    ]),
  ]);

  const brandIds = brandRows.map((r) => r._id);
  const brands =
    brandIds.length > 0
      ? ((await Brand.find({ _id: { $in: brandIds }, isActive: true })
          .select("name slug")
          .sort({ name: 1 })
          .lean()) as unknown as { _id: Types.ObjectId; name: string; slug: string }[])
      : [];

  const attributeMap = new Map<string, Set<string>>();
  for (const row of attributeRows) {
    const { name, value } = row._id;
    if (!attributeMap.has(name)) attributeMap.set(name, new Set());
    attributeMap.get(name)!.add(value);
  }

  const attributes = [...attributeMap.entries()]
    .map(([name, values]) => ({ name, values: [...values].sort(faCollator.compare) }))
    .sort((a, b) => faCollator.compare(a.name, b.name));

  return {
    brands: brands.map((b) => ({ id: String(b._id), name: b.name, slug: b.slug })),
    attributes,
  };
}

export type CategoryProductsParams = {
  categoryIds: string[] | null; // null یعنی بدون محدودیت دسته (صفحه «همه محصولات»)
  brandSlugs: string[];
  attrs: CategoryAttributeFilter[];
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sort: CategorySortValue;
  page: number;
  limit: number;
};

export type CategoryProductsResult = {
  items: ProductCardData[];
  pagination: {
    totalDocs: number;
    totalPages: number;
    page: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
};

/**
 * لیست محصولات یک دسته با فیلتر/جستجو/مرتب‌سازی/صفحه‌بندی — همه در
 * یک Query با Aggregation (`$facet`) انجام می‌شود تا:
 * ۱) از N+1 Query جلوگیری شود، ۲) شمارش کل (برای Pagination) و خودِ
 * صفحه فعلی هم‌زمان محاسبه شوند.
 *
 * محدودیت شناخته‌شده: فیلتر «بازه قیمت» روی `variants.price` خام
 * اعمال می‌شود (نه قیمت نهایی بعد از تخفیف) — محاسبه قیمت نهایی
 * داخل Query با `$expr` ممکن است اما پیچیدگی/هزینه اضافه دارد؛
 * مرتب‌سازی «ارزان‌ترین/گران‌ترین» اما از قیمت نهایی واقعی استفاده
 * می‌کند (نگاه کنید `__finalPrices` پایین).
 */
export async function getCategoryProducts(
  params: CategoryProductsParams,
): Promise<CategoryProductsResult> {
  const { categoryIds, brandSlugs, attrs, minPrice, maxPrice, search, sort, page, limit } = params;

  const match: Record<string, unknown> = {
    status: "published",
    "images.0": { $exists: true },
  };
  if (categoryIds) match.category = { $in: categoryIds };

  if (brandSlugs.length > 0) {
    const brands = (await Brand.find({ slug: { $in: brandSlugs } })
      .select("_id")
      .lean()) as unknown as { _id: Types.ObjectId }[];
    match.brand = { $in: brands.map((b) => b._id) };
  }

  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    match.title = { $regex: escaped, $options: "i" };
  }

  const andConditions: Record<string, unknown>[] = [];
  for (const attr of attrs) {
    andConditions.push({
      variants: { $elemMatch: { isActive: true, attributes: { $elemMatch: attr } } },
    });
  }
  if (minPrice !== undefined || maxPrice !== undefined) {
    andConditions.push({
      variants: {
        $elemMatch: {
          isActive: true,
          price: {
            ...(minPrice !== undefined ? { $gte: minPrice } : {}),
            ...(maxPrice !== undefined ? { $lte: maxPrice } : {}),
          },
        },
      },
    });
  }
  if (andConditions.length > 0) match.$and = andConditions;

  const skip = (page - 1) * limit;

  const sortStage: Record<string, 1 | -1> =
    sort === "newest"
      ? { createdAt: -1 }
      : sort === "cheapest"
        ? { __minPrice: 1 }
        : sort === "expensive"
          ? { __minPrice: -1 }
          : { sortOrder: 1, createdAt: -1 };

  const [result] = await Product.aggregate<{
    items: LeanProductForCard[];
    totalCount: { count: number }[];
  }>([
    { $match: match },
    {
      // قیمت نهایی هر Variant (بعد از درصد + مبلغ تخفیف) فقط برای
      // مرتب‌سازی «ارزان‌ترین/گران‌ترین» لازم است؛ محاسبه‌اش اینجا
      // حتی برای مرتب‌سازی‌های دیگر بی‌ضرر و ارزان است (یک $map
      // ساده روی حداکثر چند Variant).
      $addFields: {
        __finalPrices: {
          $map: {
            input: "$variants",
            as: "v",
            in: {
              $max: [
                0,
                {
                  $subtract: [
                    { $subtract: ["$$v.price", { $multiply: ["$$v.price", { $divide: ["$$v.discountPercent", 100] }] }] },
                    "$$v.discountAmount",
                  ],
                },
              ],
            },
          },
        },
      },
    },
    { $addFields: { __minPrice: { $min: "$__finalPrices" } } },
    { $sort: sortStage },
    {
      $facet: {
        items: [
          { $skip: skip },
          { $limit: limit },
          { $project: { title: 1, slug: 1, images: 1, variants: 1, sortOrder: 1 } },
        ],
        totalCount: [{ $count: "count" }],
      },
    },
  ]);

  const items = result?.items ?? [];
  const totalDocs = result?.totalCount[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalDocs / limit));

  const displayable = items.filter(isDisplayable);
  const colorsMap = await buildColorsMap(displayable);
  const cards = toDisplayableCards(displayable, colorsMap);

  return {
    items: cards,
    pagination: {
      totalDocs,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/** شناسه‌های دسته + زیردسته‌های آن (یا فقط یک زیردستهٔ مشخص، اگر انتخاب شده). */
export async function resolveCategoryScopeIds(
  categoryId: string,
  subcategorySlug: string | undefined,
  subcategories: LeanCategoryLite[],
): Promise<string[]> {
  if (subcategorySlug) {
    const match = subcategories.find((s) => s.slug === subcategorySlug);
    return match ? [match.id] : [categoryId];
  }
  return [categoryId, ...subcategories.map((s) => s.id)];
}
