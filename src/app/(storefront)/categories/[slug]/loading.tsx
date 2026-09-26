import { ProductGridSkeleton } from "@/components/storefront/product-grid";

export default function CategoryDetailLoading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="px-4 py-3 sm:px-6">
        <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />

        {/* هم‌الگو با ساختار واقعی `CategoryFilterBar`: یک نوار جستجو+فیلتر،
            بعد یک ردیف دو Dropdown (زیردسته/مرتب‌سازی) — دیگر چیپ‌های
            زیردسته‌ای (حذف‌شده) اینجا نمایش داده نمی‌شوند. */}
        <div className="mt-3 h-12 w-full animate-pulse rounded-xl bg-gray-200" />
        <div className="mt-2 flex gap-2">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-gray-200" />
        </div>

        <div className="mt-4 lg:flex lg:items-start lg:gap-4">
          <div className="hidden h-96 w-64 shrink-0 animate-pulse rounded-[var(--radius-lg)] bg-gray-100 lg:block" />
          <div className="flex-1">
            <ProductGridSkeleton />
          </div>
        </div>
      </div>
    </div>
  );
}
