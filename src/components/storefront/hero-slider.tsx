"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils/cn";

type HeroSlide = {
  id: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  href: string;
  gradient: string;
};

/**
 * داده Mock — طبق تصمیم مستندشده در CLAUDE.md («Phase 3: Hero
 * Slider، نیاز به مدل Banner — هنوز وجود ندارد»). ساختار فیلدها
 * (title/subtitle/ctaLabel/href) با آنچه از یک Banner واقعی در
 * آینده انتظار می‌رود هماهنگ است تا فقط منبع داده عوض شود، نه شکل
 * Slide. به‌جای عکس واقعی (که هنوز هیچ Asset ای در پروژه آپلود
 * نشده)، از Gradient رنگی به‌عنوان Placeholder بصری استفاده شده —
 * نه یک عکس Stock/Hotlink شده که بعداً باید حذف شود.
 */
const HERO_SLIDES: HeroSlide[] = [
  {
    id: "1",
    title: "جشنواره پاییزه فرش",
    subtitle: "تا ۳۰٪ تخفیف روی فرش‌های ماشینی طرح ابریشم",
    ctaLabel: "مشاهده محصولات",
    href: "/categories",
    gradient: "from-indigo-600 to-blue-500",
  },
  {
    id: "2",
    title: "کالکشن جدید تابلوفرش",
    subtitle: "طرح‌های اصیل ایرانی با کیفیت دستباف",
    ctaLabel: "کشف کنید",
    href: "/categories",
    gradient: "from-rose-500 to-orange-400",
  },
  {
    id: "3",
    title: "ارسال رایگان",
    subtitle: "برای خریدهای بالای ۵ میلیون تومان، سراسر کشور",
    ctaLabel: "شروع خرید",
    href: "/categories",
    gradient: "from-emerald-500 to-teal-400",
  },
];

const AUTOPLAY_INTERVAL_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

/**
 * Hero Slider صفحه اصلی — روی همه Breakpoint‌ها نمایش داده می‌شود
 * (برخلاف Top/Bottom Bar که فقط موبایل بودند).
 *
 * پیاده‌سازی با `transform: translateX` + State به‌جای CSS
 * Scroll-Snap خام، چون Autoplay و Dot Indicator نیاز به کنترل
 * کامل روی Index فعلی دارند. Swipe لمسی با `onTouchStart/End`
 * (بدون کتابخانه اضافه). Client Component واقعاً لازم است
 * (Autoplay + Swipe State) — طبق اصل پروژه («مگر Client Component
 * واقعاً لازم باشد»).
 *
 * نکته فنی مهم درباره RTL: ردیف اسلایدها عمداً `dir="ltr"` دارد
 * (برخلاف بقیه سایت) تا محاسبه `translateX` ساده و قابل‌پیش‌بینی
 * بماند — در RTL، ترتیب بصری Flex Item ها برعکس DOM می‌شود و
 * فرمول جابه‌جایی را غیرمستقیم و مستعد خطا می‌کند. متن/دکمه داخل
 * هر اسلاید دوباره `dir="rtl"` می‌گیرد تا محتوای فارسی درست چیده
 * شود؛ فقط مکانیزم اسلاید (نه محتوا) از این Override تأثیر
 * می‌گیرد.
 *
 * چون هنوز هیچ Fetch واقعی/Async ای در کار نیست (داده Mock و
 * Sync است)، فعلاً `loading.tsx` برای این بخش لازم نبود؛ وقتی به
 * API واقعی Banner وصل شد (که Async خواهد بود)، طبق بند ۲۱-۲۲
 * Master Workflow باید یک HeroSkeleton واقعی اضافه شود.
 */
export function HeroSlider() {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % HERO_SLIDES.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  function goTo(nextIndex: number) {
    setIndex((nextIndex + HERO_SLIDES.length) % HERO_SLIDES.length);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    // متن RTL است، اما جهت Swipe فیزیکی صفحه است: کشیدن به راست
    // (deltaX مثبت) یعنی برگشتن به اسلاید قبلی.
    if (deltaX > 0) {
      goTo(index - 1);
    } else {
      goTo(index + 1);
    }
  }

  return (
    <section className="px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          dir="ltr"
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(${-index * 100}%)` }}
        >
          {HERO_SLIDES.map((slide) => (
            <Link
              key={slide.id}
              href={slide.href}
              dir="rtl"
              className={cn(
                "aspect-[16/9] w-full shrink-0 bg-gradient-to-l sm:aspect-[21/9]",
                slide.gradient,
              )}
            >
              <div className="flex h-full flex-col items-start justify-end gap-2 p-5 sm:p-8">
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  {slide.title}
                </h2>
                <p className="max-w-xs text-sm text-white/85 sm:text-base">
                  {slide.subtitle}
                </p>
                <span className="mt-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--sf-ink)] sm:text-sm">
                  {slide.ctaLabel}
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
          {HERO_SLIDES.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`اسلاید ${slideIndex + 1}`}
              aria-current={slideIndex === index}
              onClick={() => goTo(slideIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
