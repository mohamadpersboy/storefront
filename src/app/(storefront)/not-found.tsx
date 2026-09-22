import Link from "next/link";
import { SearchX } from "lucide-react";

/**
 * صفحه ۴۰۴ سطح گروه Storefront — قبل از این فایل، این گروه هیچ
 * `not-found.tsx`ای نداشت، پس `notFound()` (مثلاً از صفحه محصول
 * برای Slug نامعتبر/محصول Draft) به صفحه ۴۰۴ پیش‌فرض خنثای
 * Next.js می‌رسید، نه یک صفحه هم‌ساختار با هویت بصری سایت — همان
 * دسته مشکلی که `error.tsx` را برای خطاهای سرور رفع کرد، این‌جا
 * برای «پیدا نشد» هم رفع می‌شود.
 */
export default function StorefrontNotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--sf-accent-soft)] to-white text-[var(--sf-accent)] ring-1 ring-black/5">
        <SearchX className="size-9" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[var(--sf-ink)]">این صفحه پیدا نشد</p>
        <p className="max-w-[260px] text-xs leading-6 text-[var(--sf-ink)]/50">
          ممکن است لینک اشتباه باشد یا این محصول/صفحه دیگر در دسترس نباشد.
        </p>
      </div>
      <Link
        href="/"
        className="mt-1 rounded-full bg-[var(--sf-accent)] px-6 py-2.5 text-xs font-bold text-white active:bg-[var(--sf-accent-hover)]"
      >
        بازگشت به فروشگاه
      </Link>
    </div>
  );
}
