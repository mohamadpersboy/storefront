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
const AUTO_SCROLL_MIN_ITEMS = 5; // یعنی «بیشتر از ۴ عدد» طبق درخواست کارفرما

/**
 * ردیف دکمه‌های میان‌بر دسته‌بندی زیر Hero Slider — کارت مربعی +
 * عنوان زیرش (رفرنس کارفرما: تصویر اپ میوه/سبزیجات). فقط
 * دسته‌بندی‌هایی که در Dashboard «نمایش در صفحه اصلی» تیک خورده‌اند
 * (و سطح اول هستند) اینجا می‌آیند.
 *
 * اگر تعداد از ۴ بیشتر باشد (طبق درخواست صریح)، یک Auto-Scroll
 * بسیار آرام با `requestAnimationFrame` فعال می‌شود که در برخورد به
 * دو انتها جهتش را برعکس می‌کند (رفت‌وبرگشتی، نه یک پرش ناگهانی به
 * ابتدا). لمس/کلیک کاربر (`onPointerDown`) Auto-Scroll را موقت
 * متوقف می‌کند و ~۲.۵ ثانیه بعد از رها کردن دوباره از سر گرفته
 * می‌شود؛ خودِ Scroll دستی همیشه از طریق Overflow بومی مرورگر کار
 * می‌کند (بدون هیچ کد اضافه).
 *
 * نکته فنی RTL: ظرف Scroll عمداً `dir="ltr"` است تا رفتار
 * `scrollLeft` بین مرورگرها یکسان/قابل‌پیش‌بینی بماند (در RTL این
 * مقدار بین مرورگرها ناهماهنگ است). برای حفظ ترتیب خواندن راست‌به‌
 * چپ، آرایه دسته‌ها قبل از رندر برعکس می‌شود؛ نتیجه بصری همان
 * ترتیب RTL طبیعی است.
 */
export function CategoryShortcuts({ categories }: { categories: HomepageCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const directionRef = useRef(1);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shouldAutoScroll = categories.length >= AUTO_SCROLL_MIN_ITEMS;

  useEffect(() => {
    if (!shouldAutoScroll) return;
    let rafId: number;

    function tick() {
      const el = scrollRef.current;
      if (el && !pausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 1) {
          el.scrollLeft += directionRef.current * AUTO_SCROLL_PX_PER_FRAME;
          if (el.scrollLeft >= maxScroll) directionRef.current = -1;
          else if (el.scrollLeft <= 0) directionRef.current = 1;
        }
      }
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [shouldAutoScroll]);

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

  const orderedForLtrScroll = [...categories].reverse();

  return (
    <section className="px-4 pt-4 sm:px-6">
      <div
        ref={scrollRef}
        dir="ltr"
        onPointerDown={pause}
        onPointerUp={resumeAfterDelay}
        onPointerCancel={resumeAfterDelay}
        className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {orderedForLtrScroll.map((category) => (
          <Link
            key={category.id}
            href={`/categories/${category.slug}`}
            dir="rtl"
            className="flex w-20 shrink-0 flex-col items-center gap-1.5 sm:w-24"
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-black/5 bg-white shadow-[0_2px_8px_rgba(3,23,37,0.06)]">
              {category.imageUrl ? (
                <Image
                  src={category.imageUrl}
                  alt={category.name}
                  fill
                  className="object-cover"
                  placeholder={category.imageBlurDataUrl ? "blur" : "empty"}
                  blurDataURL={category.imageBlurDataUrl ?? undefined}
                  sizes="96px"
                />
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
