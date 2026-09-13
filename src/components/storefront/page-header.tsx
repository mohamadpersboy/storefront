"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type PageHeaderProps = {
  title: string;
};

/**
 * هدر ساده صفحات داخلی Storefront (برخلاف `MobileTopBar` که فقط
 * برای صفحه اصلی است: Logo + Search/Bell/Support). این هدر فقط
 * یک دکمه بازگشت + عنوان صفحه دارد — الگوی معمول صفحات دوم‌به‌بعد
 * در اپ‌های موبایل فارسی (اولین مصرف‌کننده: صفحه «حساب من»).
 *
 * از `router.back()` استفاده می‌شود نه یک `href` ثابت، چون کاربر
 * ممکن است از مسیرهای مختلفی (Bottom Bar، لینک داخل صفحه دیگر) به
 * این صفحه رسیده باشد؛ برگشت به تاریخچه واقعی مرورگر درست‌تر از یک
 * مقصد ثابت حدسی است.
 *
 * جهت فلش: چون کل سایت `dir="rtl"` است، «بازگشت» از نظر بصری به
 * سمت راست است — `ArrowRight` (نه `ArrowLeft`) در RTL دقیقاً همان
 * جهت آشنای «برگشت» را می‌دهد.
 *
 * استایل Backdrop/Sticky عیناً هم‌الگو با `MobileTopBar` (هماهنگی
 * بصری بین صفحه اصلی و صفحات داخلی).
 */
export function PageHeader({ title }: PageHeaderProps) {
  const router = useRouter();

  return (
    <div
      className={cn(
        "sticky top-0 z-40",
        "border-b border-black/5 bg-white/75 backdrop-blur-xl",
        "px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]",
      )}
    >
      <div className="flex items-center justify-between">
        <h1 className="text-base font-bold text-[var(--sf-ink)]">{title}</h1>
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="بازگشت"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
