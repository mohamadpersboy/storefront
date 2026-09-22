"use client";

import { useEffect } from "react";
import { RefreshCw, TriangleAlert } from "lucide-react";

/**
 * Error Boundary سطح گروه Storefront — قبل از این فایل، هیچ
 * `error.tsx`ای در کل `(storefront)` وجود نداشت (برخلاف
 * `(dashboard)` که چند صفحه‌اش دارد)، پس یک خطای رفع‌نشده در هر
 * Server Component این گروه (مثلاً صفحه محصول) مستقیم به صفحه خام
 * عمومی مرورگر («This page couldn't load / A server error
 * occurred») می‌رسید، نه یک صفحه هم‌ساختار با طراحی سایت.
 *
 * این خودِ علت ریشه‌ای خطاهای احتمالی را رفع نمی‌کند (آن‌ها همچنان
 * باید جدا بررسی/رفع شوند — نگاه کنید `console.error` پایین برای
 * ردیابی در Log واقعی Vercel)، فقط یک شبکه ایمنی سراسری اضافه
 * می‌کند: کاربر یک صفحه آشنا با دکمه «تلاش دوباره» می‌بیند، نه یک
 * خطای خام بی‌ربط به هویت بصری سایت.
 */
export default function StorefrontError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Storefront route error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-red-50 text-danger">
        <TriangleAlert className="size-6" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <p className="text-sm font-bold text-[var(--sf-ink)]">مشکلی در بارگذاری این صفحه پیش آمد</p>
      <p className="max-w-xs text-xs leading-6 text-[var(--sf-ink)]/50">
        لطفاً دوباره تلاش کنید. اگر مشکل ادامه داشت، کمی بعد دوباره سر بزنید.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-2 flex items-center gap-2 rounded-full bg-[var(--sf-accent)] px-6 py-2.5 text-xs font-bold text-white active:bg-[var(--sf-accent-hover)]"
      >
        <RefreshCw className="size-4" strokeWidth={1.75} aria-hidden="true" />
        تلاش دوباره
      </button>
    </div>
  );
}
