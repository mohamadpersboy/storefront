import { z } from "zod";

/**
 * پارامترهای صفحه لیست محصولات یک دسته‌بندی (`/categories/[slug]`) —
 * همه از URL Query خوانده می‌شوند (بند «Query Parameters» درخواست:
 * وضعیت فیلتر باید با URL Sync باشد). این فایل فقط Parse/Validate
 * می‌کند؛ خود Query ساخت آن در `src/lib/storefront/category-listing.ts`
 * است.
 */

export const CATEGORY_SORT_VALUES = ["default", "newest", "cheapest", "expensive"] as const;
export type CategorySortValue = (typeof CATEGORY_SORT_VALUES)[number];

const DEFAULT_PAGE_SIZE = 12;

export const categoryProductsQuerySchema = z.object({
  subcategory: z.string().trim().toLowerCase().optional(),
  /** چند برند هم‌زمان — در URL به‌صورت `brand=a&brand=b` یا `brand=a,b`. */
  brand: z.array(z.string().trim().toLowerCase()).default([]),
  /** بازه قیمت — تومان. */
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  search: z.string().trim().max(100).optional(),
  sort: z.enum(CATEGORY_SORT_VALUES).default("default"),
  page: z.coerce.number().int().min(1).default(1),
});

export type CategoryAttributeFilter = { name: string; value: string };

/**
 * فیلترهای ویژگی‌های Variant (اندازه/شانه/تراکم/...) عمومی و پویا
 * هستند (نگاه کنید `Product.variants[].attributes`) — پس در URL با
 * یک کلید تکرارشونده `attr` به‌شکل `name:value` نگه داشته می‌شوند
 * (مثلاً `attr=شانه:1200&attr=اندازه:9 متری`)، نه یک اسم Query Param
 * مجزا برای هرکدام (که Hard-code کردن اسم ویژگی‌ها را لازم می‌آورد).
 */
export function parseAttributeFilters(values: string[]): CategoryAttributeFilter[] {
  const result: CategoryAttributeFilter[] = [];
  for (const raw of values) {
    const separatorIndex = raw.indexOf(":");
    if (separatorIndex <= 0) continue;
    const name = raw.slice(0, separatorIndex).trim();
    const value = raw.slice(separatorIndex + 1).trim();
    if (name && value) result.push({ name, value });
  }
  return result;
}

export function serializeAttributeFilter(filter: CategoryAttributeFilter): string {
  return `${filter.name}:${filter.value}`;
}

export function parseCategoryProductsQuery(searchParams: URLSearchParams) {
  const brand = searchParams.getAll("brand").flatMap((v) => v.split(","));
  const parsed = categoryProductsQuerySchema.safeParse({
    subcategory: searchParams.get("subcategory") ?? undefined,
    brand: brand.filter(Boolean),
    minPrice: searchParams.get("minPrice") ?? undefined,
    maxPrice: searchParams.get("maxPrice") ?? undefined,
    search: searchParams.get("search") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  const attrs = parseAttributeFilters(searchParams.getAll("attr"));

  if (!parsed.success) {
    return {
      subcategory: undefined,
      brand: [] as string[],
      minPrice: undefined,
      maxPrice: undefined,
      search: undefined,
      sort: "default" as CategorySortValue,
      page: 1,
      attrs,
    };
  }

  return { ...parsed.data, attrs };
}

export const CATEGORY_PAGE_SIZE = DEFAULT_PAGE_SIZE;
