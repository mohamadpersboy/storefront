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
 * نکته فنی RTL (اصلاح نهایی — دو تلاش قبلی هر دو روی حدس اشتباه از
 * رفتار `scrollLeft` در RTL بنا شده بودند و هر دو در عمل شکست
 * خوردند): ظرف Scroll `dir="rtl"` طبیعی دارد (مثل بقیه صفحه)، بدون
 * Reverse کردن آرایه — این بخش (که در تلاش اول اشتباه بود) درست
 * است و کارفرما هم تأیید کرد اولین دسته درست از راست نشان داده
 * می‌شود. مشکل فقط در جهت حرکت Auto-Scroll بود: مشخصات استاندارد
 * CSSOM View می‌گوید `scrollLeft` باید منفی شود، اما در عمل این
 * رفتار بین مرورگرها/نسخه‌ها به‌طرز مستندی متفاوت پیاده‌سازی شده
 * (بعضی مرورگرها بازه `[0, +max]` را نگه می‌دارند، نه `[-max, 0]`)
 * — همان چیزی که باعث شد فرض «باید منفی برود» در تلاش قبلی کاملاً
 * متوقفش کند (مقدار منفی Clamp به ۰ می‌شد).
 *
 * **راه‌حل نهایی: به‌جای حدس زدن، بازه معتبر در Runtime تشخیص داده
 * می‌شود** (`detectRangeSign`) — دقیقاً همان تکنیک استاندارد صنعتی
 * که کتابخانه‌هایی مثل Bootstrap RTL/jQuery برای همین مشکل مستند
 * استفاده می‌کنند: یک‌بار امتحان می‌کنیم `scrollLeft` را با ۲۰+
 * افزایش دهیم؛ اگر واقعاً تغییر کرد (Clamp نشد)، یعنی بازه معتبر
 * `[0,+max]` است؛ در غیر این صورت `[-max,0]` امتحان و استفاده
 * می‌شود. این تشخیص فقط یک‌بار (هنگام Mount) اجرا می‌شود، نه هر
 * Frame؛ رفت‌وبرگشت Auto-Scroll هم با همین بازه تشخیص‌داده‌شده
 * (نه یک فرض ثابت) محاسبه می‌شود.
 */
export function CategoryShortcuts({ categories }: { categories: HomepageCategory[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // rangeSignRef: تشخیص یک‌بارهٔ این‌که در این مرورگر خاص، بازه
  // معتبر scrollLeft برای RTL چیست — `1` یعنی `[0, +max]` (رایج در
  // برخی پیاده‌سازی‌ها)، `-1` یعنی `[-max, 0]` (طبق مشخصات استاندارد
  // CSSOM View). velocityRef جهت لحظه‌به‌لحظه حرکت است که برای
  // رفت‌وبرگشت بین این دو مرز عوض می‌شود.
  const rangeSignRef = useRef<1 | -1>(1);
  const velocityRef = useRef<1 | -1>(1);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    function detectRangeSign(node: HTMLDivElement): 1 | -1 {
      const start = node.scrollLeft;

      node.scrollLeft = start + 20;
      const positiveWorked = node.scrollLeft !== start;
      node.scrollLeft = start;
      if (positiveWorked) return 1;

      node.scrollLeft = start - 20;
      const negativeWorked = node.scrollLeft !== start;
      node.scrollLeft = start;
      return negativeWorked ? -1 : 1;
    }

    rangeSignRef.current = detectRangeSign(el);
    velocityRef.current = rangeSignRef.current;

    let rafId: number;

    function tick() {
      if (el && !pausedRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 1) {
          const low = rangeSignRef.current === 1 ? 0 : -maxScroll;
          const high = rangeSignRef.current === 1 ? maxScroll : 0;

          el.scrollLeft += velocityRef.current * AUTO_SCROLL_PX_PER_FRAME;
          if (el.scrollLeft >= high) velocityRef.current = -1;
          else if (el.scrollLeft <= low) velocityRef.current = 1;
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
