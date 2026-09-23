/**
 * Skeleton صفحه «علاقه‌مندی‌ها» — بعد از تغییر کارت‌ها به افقی، شکل
 * Skeleton هم عوض شد تا ساختار واقعی جدید (عکس مربعی راست + دو خط
 * متن + ردیف قیمت چپ) را منعکس کند (بند «Skeleton System» بخش ۶
 * CLAUDE.md: نه Generic).
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

      <div className="mx-auto flex max-w-xl flex-col gap-3 px-4 py-4 sm:px-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="flex gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-3"
          >
            <div className="size-24 shrink-0 animate-pulse rounded-[var(--radius-md)] bg-gray-200" />
            <div className="flex min-w-0 flex-1 flex-col justify-between py-0.5">
              <div className="space-y-2">
                <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-2/3 animate-pulse rounded bg-gray-200" />
              </div>
              <div className="h-4 w-16 animate-pulse self-end rounded bg-gray-200" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
