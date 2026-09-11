"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { LayoutGrid } from "lucide-react";

export type HomepageCategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  imageBlurDataUrl: string | null;
};

const AUTO_SCROLL_PX_PER_FRAME = 0.15;
const RESUME_DELAY_MS = 2500;

/**
 * ردیف دکمه‌های میان‌بر دسته‌بندی زیر Hero Slider — کارت مربعی +
 * عنوان زیرش (رفرنس کارفرما: تصویر اپ میوه/سبزیجات). فقط
 * دسته‌بندی‌هایی که در Dashboard «نمایش در صفحه اصلی» تیک خورده‌اند
 * (و سطح اول هستند) اینجا می‌آیند.
 *
 * Auto-Scroll بسیار آرام با `requestAnimationFrame`، رفت‌وبرگشتی
 * (نه پرش ناگهانی به ابتدا). **به‌جای شرط تعداد ثابت («اگر بیش از
 * ۴ تا»)، از Overflow واقعی مرورگر استفاده می‌شود** (`scrollWidth
 * > clientWidth`) — چون تعداد آیتم به‌تنهایی تضمین نمی‌کند در همه
 * عرض صفحه Overflow واقعی رخ بدهد یا نه (روی صفحه‌های بزرگ‌تر ۵ آیتم
 * ممکن است جا شود، روی صفحه‌های کوچک‌تر ۴ آیتم ممکن است Overflow
 * شود). Loop همیشه اجرا می‌شود؛ بررسی داخلی `maxScroll > 1` خودش
 * تضمین می‌کند وقتی واقعاً چیزی برای Scroll نیست، هیچ حرکتی هم رخ
 * ندهد — این دقیقاً همان رفتار مطلوب («اگر بیشتر از ۴ تا بود
 * پیمایش داشته باشند») را با معیار درست‌تری تأمین می‌کند.
 *
 * لمس/کلیک کاربر (`onPointerDown`) Auto-Scroll را موقت متوقف
 * می‌کند و ~۲.۵ ثانیه بعد از رها کردن دوباره از سر گرفته می‌شود؛
 * خودِ Scroll دستی همیشه از طریق Overflow بومی مرورگر کار می‌کند
 * (بدون هیچ کد اضافه).
 *
 * نکته فنی RTL (اصلاح‌شده — تلاش قبلی اشتباه بود): ظرف Scroll حالا
 * `dir="rtl"` طبیعی دارد (مثل بقیه صفحه)، بدون Reverse کردن آرایه.
 * تلاش قبلی (`dir="ltr"` اجباری + Reverse آرایه) باعث دو باگ واقعی
 * می‌شد: (۱) اولین دسته‌بندی‌ها به‌جای راست، در انتهای Scroll
 * (نیازمند اسکرول به چپ) قرار می‌گرفتند، و (۲) جهت Auto-Scroll هم
 * به‌خاطر مبنای اشتباه هرگز واقعاً حرکت نمی‌کرد. طبق مشخصات
 * استاندارد CSSOM View برای `dir="rtl"`: `scrollLeft` از ۰ (لبه
 * راست/شروع محتوا) تا `-(scrollWidth - clientWidth)` (لبه چپ/پایان
 * محتوا) منفی می‌شود — یعنی با مقدار پیش‌فرض ۰، دسته‌بندی اول
 * دقیقاً در راست‌ترین جای دیده می‌شود (بدون نیاز به هیچ Reverse ای)
 * و Auto-Scroll باید به سمت منفی حرکت کند تا دسته‌های بعدی را نشان
 * دهد. مرورگرهای هدف این پروژه (Chrome/Safari موبایل مدرن) این
 * استاندارد را به‌درستی پیاده‌سازی می‌کنند.
 */
export function CategoryShortcuts({ categories }: { categories: HomepageCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(-1);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let rafId: number;

    function tick() {
      const el = scrollRef.current;
      if (el && !pausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 1) {
          el.scrollLeft += directionRef.current * AUTO_SCROLL_PX_PER_FRAME;
          if (el.scrollLeft <= -maxScroll) directionRef.current = 1;
          else if (el.scrollLeft >= 0) directionRef.current = -1;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [categories.length]);

  function pause() {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }

  function resumeAfterDelay() {
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }

  if (categories.length === 0) return null;

  return (
    <section className="px-4 pt-4 sm:px-6">
      <div
        ref={scrollRef}
        dir="rtl"
        onPointerDown={pause}
        onPointerUp={resumeAfterDelay}
        onPointerCancel={resumeAfterDelay}
        className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {categories.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            className="flex w-20 shrink-0 flex-col items-center gap-1.5 sm:w-24"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_8px_rgba(3,23,37,0.06)]">
              {category.imageUrl ? (
                <div className="absolute inset-1.5 overflow-hidden rounded-xl">
                  <Image
                    src={category.imageUrl}
                    alt={category.name}
                    fill
                    className="object-cover"
                    placeholder={category.imageBlurDataUrl ? "blur" : "empty"}
                    blurDataURL={category.imageBlurDataUrl ?? undefined}
                    sizes="96px"
                  />
                </div>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <LayoutGrid className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
                </div>
              )}
            </div>
            <span className="line-clamp-1 text-xs font-medium text-[var(--sf-ink)]">
              {category.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
