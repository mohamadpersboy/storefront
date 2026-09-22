"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, PackageSearch } from "lucide-react";

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
 * می‌کند.
 *
 * **بازطراحی (طبق بازخورد صریح کارفرما — نسخه اول «متناسب و زیبا»
 * نبود):** به‌جای یک آیکون قرمز/خاکستری ژنریک، هم‌الگو با بقیه
 * صفحات Storefront شد — دایره گرادیانی نرم با همان توکن‌های
 * `--sf-accent`ی که در سراسر سایت استفاده می‌شود (نه رنگ قرمز
 * هشدار که به هویت بصری سایت تعلق ندارد)، تایپوگرافی/فاصله‌گذاری
 * هم‌سنگ با کارت‌های دیگر سایت (مثل خالی‌بودن سبد خرید)، و یک دکمه
 * دومِ «بازگشت به فروشگاه» علاوه بر «تلاش دوباره».
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
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--sf-accent-soft)] to-white text-[var(--sf-accent)] ring-1 ring-black/5">
        <PackageSearch className="size-9" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[var(--sf-ink)]">مشکلی در بارگذاری این صفحه پیش آمد</p>
        <p className="max-w-[260px] text-xs leading-6 text-[var(--sf-ink)]/50">
          یک خطای فنی موقت رخ داد. لطفاً دوباره تلاش کنید؛ اگر مشکل ادامه داشت، کمی بعد دوباره سر بزنید.
        </p>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-full bg-[var(--sf-accent)] px-6 py-2.5 text-xs font-bold text-white active:bg-[var(--sf-accent-hover)]"
        >
          <RefreshCw className="size-4" strokeWidth={1.75} aria-hidden="true" />
          تلاش دوباره
        </button>
        <Link
          href="/"
          className="rounded-full border border-black/10 px-5 py-2.5 text-xs font-bold text-[var(--sf-ink)]/70 active:bg-gray-50"
        >
          بازگشت به فروشگاه
        </Link>
      </div>
    </div>
  );
}
