/**
 * پارس شماره صفحه (`?page=`) برای هر صفحه لیستی Storefront که از
 * Query Param ساده (نه یک Library) برای Pagination استفاده می‌کند
 * (فعلاً `/favorites` و `/orders`). عدد نامعتبر (رشته/صفر/منفی/
 * اعشاری/خالی) همیشه به صفحه ۱ برمی‌گردد.
 *
 * قبلاً این منطق فقط داخل `get-favorite-products.ts` به‌صورت
 * `parseFavoritesPage` بود؛ چون `/orders` هم به همان منطق نیاز
 * داشت، به این فایل مشترک منتقل شد (طبق قانون پروژه: از Duplicate
 * کردن همین چند خط خودداری کن). `parseFavoritesPage` همچنان با
 * همان نام/امضا صادر می‌شود، فقط داخلش این تابع را صدا می‌زند.
 */
export function parsePageParam(raw: string | undefined): number {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < 1) return 1;
  return parsed;
}
