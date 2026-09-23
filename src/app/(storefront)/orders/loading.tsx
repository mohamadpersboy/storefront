/**
 * Skeleton صفحه «سفارش‌های من» — تب‌ها + چند ردیف کارت (بند
 * «Skeleton System» بخش ۶ CLAUDE.md: ساختار واقعی را منعکس کند، نه
 * Generic).
 */
export default function OrdersLoading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-8 w-20 shrink-0 animate-pulse rounded-full bg-gray-100" />
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-3.5"
            >
              <div className="size-11 shrink-0 animate-pulse rounded-[var(--radius-md)] bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
