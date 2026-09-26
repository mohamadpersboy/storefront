import { Search, SlidersHorizontal, LayoutGrid } from "lucide-react";
import { PageHeader } from "@/components/storefront/page-header";
import { CategoryProductsSection } from "@/components/storefront/category-products-section";
import { EmptyState } from "@/components/storefront/empty-state";
import { connectToDatabase } from "@/lib/db/connect";
import { getAllRootCategorySections } from "@/lib/storefront/category-listing";

export const metadata = {
  title: "دسته‌بندی فرش‌ها | فرش سقطچی",
};

/**
 * دقیقاً هم‌الگو با `revalidate = 60` صفحه اصلی — این صفحه هم بدون
 * هیچ API پویا (Query String/Cookie) است، پس Next.js آن را در
 * Build-Time به‌صورت Static/ISR پیش‌تولید می‌کند؛ هر ۶۰ ثانیه دوباره
 * Generate می‌شود تا دسته‌بندی/محصول جدید از Dashboard دیر دیده
 * نشود.
 */
export const revalidate = 60;

/**
 * صفحه اصلی دسته‌بندی‌ها (بند ۱ درخواست) — هر دسته‌بندی سطح اول
 * فعال یک بخش/Slider محصول مستقل با دکمه «بیشتر» به صفحه اختصاصی
 * خودش می‌گیرد؛ از همان `CategoryProductsSection` صفحه اصلی استفاده
 * می‌شود (بدون Duplicate). دسته‌های بدون محصول قابل‌نمایش از خروجی
 * `getAllRootCategorySections` حذف شده‌اند.
 *
 * جستجو/فیلتر بالای صفحه یک ورودی GET ساده به `/categories/all` است
 * (بدون JS، همان صفحه اختصاصی دسته با یک شبه‌دسته «همه» — نگاه کنید
 * توضیح در `[slug]/page.tsx`) — این صفحه خودش یک تجربه فیلتر/جستجوی
 * کامل نمی‌سازد، آن‌ها را به صفحه‌ای که زیرساختش را دارد ارجاع
 * می‌دهد (بند «از ایجاد ساختار موازی خودداری کن»).
 */
async function getSectionsSafe() {
  // هم‌الگو با هر Getter صفحه اصلی (`getActiveBanners`, ...): نبود/خرابی
  // موقت DB نباید کل صفحه (یا Build ایستای آن) را خراب کند — فقط یک
  // لیست خالی نمایش داده می‌شود.
  try {
    await connectToDatabase();
    return await getAllRootCategorySections();
  } catch {
    return [];
  }
}

export default async function CategoriesIndexPage() {
  const sections = await getSectionsSafe();

  return (
    <div>
      <PageHeader title="دسته‌بندی فرش‌ها" />

      <div className="px-4 py-3 sm:px-6">
        {/* یک نگهدارنده سفید حاشیه‌دار تمام‌عرض شامل باکس جستجو + دکمه
            فیلتر — عیناً هم‌الگو با نوار جستجوی `/categories/[slug]`
            (`CategoryFilterBar`) تا هر دو صفحه یک زبان بصری واحد
            داشته باشند. */}
        <form
          action="/categories/all"
          method="GET"
          className="flex h-12 w-full items-stretch overflow-hidden rounded-xl border border-black/10 bg-white"
        >
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="search"
              placeholder="جستجو در فرش‌ها..."
              className="h-full w-full bg-transparent ps-10 pe-4 text-xs text-[var(--sf-ink)] outline-none placeholder:text-gray-400"
            />
          </div>
          <button
            type="submit"
            aria-label="فیلتر"
            className="flex w-12 shrink-0 items-center justify-center border-s border-black/10 text-gray-500 active:bg-gray-50"
          >
            <SlidersHorizontal className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </button>
        </form>
      </div>

      {sections.length > 0 ? (
        sections.map((section) => (
          <CategoryProductsSection
            key={section.id}
            title={section.name}
            seeAllHref={`/categories/${section.slug}`}
            items={section.items}
          />
        ))
      ) : (
        <EmptyState
          icon={LayoutGrid}
          title="هنوز محصولی منتشر نشده است"
          actionLabel="بازگشت به فروشگاه"
          actionHref="/"
        />
      )}
    </div>
  );
}
