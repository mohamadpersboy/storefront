/**
 * Skeleton صفحه «علاقه‌مندی‌ها» — ساختار Grid را عیناً منعکس می‌کند
 * (بند «Skeleton System» بخش ۶ CLAUDE.md: نه Generic، بدون Layout
 * Shift). تعداد کارت‌های Placeholder برابر `FAVORITES_PAGE_SIZE`
 * است تا ارتفاع صفحه در حالت Loading با حالت پر تفاوت چشمگیر نداشته
 * باشد.
 */
export default function FavoritesLoading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-5 px-4 py-4 sm:grid-cols-3 sm:px-6 lg:grid-cols-4">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index}>
            <div className="aspect-[3/4] w-full animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-3 w-full animate-pulse rounded bg-gray-200" />
            <div className="mt-1.5 h-3 w-2/3 animate-pulse rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
