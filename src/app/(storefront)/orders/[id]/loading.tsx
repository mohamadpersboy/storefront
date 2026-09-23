/**
 * Skeleton صفحه جزئیات سفارش — بنر وضعیت + سه کارت (اطلاعات/کالاها/
 * پیگیری)، هم‌ساختار با صفحه واقعی (بند «Skeleton System» بخش ۶
 * CLAUDE.md).
 */
export default function OrderDetailLoading() {
  return (
    <div>
      <div className="sticky top-0 z-40 border-b border-black/5 bg-white/75 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />
        </div>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-6">
        <div className="h-20 animate-pulse rounded-[var(--radius-lg)] bg-gray-100" />

        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
            <div className="mb-3 h-3 w-24 animate-pulse rounded bg-gray-200" />
            <div className="space-y-2.5">
              <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
