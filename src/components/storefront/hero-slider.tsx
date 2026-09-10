"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

export type HeroBannerSlide = {
  id: string;
  title: string;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string;
  imageUrl: string;
  imageBlurDataUrl: string | null;
};

const AUTOPLAY_INTERVAL_MS = 4500;
const SWIPE_THRESHOLD_PX = 40;

/**
 * Hero Slider صفحه اصلی — روی همه Breakpoint‌ها نمایش داده می‌شود
 * (برخلاف Top/Bottom Bar که فقط موبایل بودند).
 *
 * داده از `banners` (Props) می‌آید — از یک Fetch واقعی سمت Server
 * در `page.tsx` به `/api/v1/banners` (که خودش از مدل واقعی `Banner`
 * در Dashboard → تنظیمات → اسلایدر پر می‌شود، نه دیگر Mock). اگر
 * هیچ بنر فعالی وجود نداشته باشد، این کامپوننت چیزی رندر نمی‌کند
 * (`return null`) — یک Empty State صادقانه به‌جای نمایش همیشگی
 * محتوای نمونه.
 *
 * پیاده‌سازی با `transform: translateX` + State به‌جای CSS
 * Scroll-Snap خام، چون Autoplay و Dot Indicator نیاز به کنترل
 * کامل روی Index فعلی دارند. Swipe لمسی با `onTouchStart/End`
 * (بدون کتابخانه اضافه). Client Component واقعاً لازم است
 * (Autoplay + Swipe State) — طبق اصل پروژه («مگر Client Component
 * واقعاً لازم باشد»).
 *
 * نکته فنی مهم درباره RTL: ردیف اسلایدها عمداً `dir="ltr"` دارد
 * (برخلاف بقیه سایت) تا محاسبه `translateX` در تداخل با ترتیب
 * برعکس Flex در RTL گم نشود — در RTL ترتیب بصری Flex Item ها
 * برعکس DOM می‌شود. محتوای هر اسلاید دوباره `dir="rtl"` می‌گیرد.
 *
 * Mesh Blur (بند ۲۷-۳۰ Master Workflow): از قابلیت بومی
 * `placeholder="blur"` خود Next.js Image استفاده شده، با
 * `blurDataURL` واقعیِ همان تصویر (تولیدشده هنگام آپلود در
 * Dashboard، نگاه کنید `banner-form-modal.tsx`) — نه یک
 * Placeholder خاکستری Generic.
 *
 * Dot Indicator: پایین و خارج از خود تصاویر قرار دارد (نه Overlay
 * روی تصویر) — طبق بازخورد صریح کارفرما.
 *
 * رفلکس: یک بازتاب بسیار محو و کاملاً نامحسوس از تصویر جاری، زیر
 * و خارج از قاب اسلایدر (نه داخلش) — تصویر وارونه‌شده با Blur و
 * Opacity خیلی پایین + Mask محوشونده، صرفاً یک جلوه اتمسفریک است،
 * `aria-hidden` (تزئینی، بدون معنای محتوایی).
 */
export function HeroSlider({ banners }: { banners: HeroBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  function goTo(nextIndex: number) {
    setIndex((nextIndex + banners.length) % banners.length);
  }

  function handleTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function handleTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX > 0) {
      goTo(index - 1);
    } else {
      goTo(index + 1);
    }
  }

  const current = banners[index];

  return (
    <section className="relative px-4 pt-4 sm:px-6 sm:pt-6">
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
          {banners.map((slide, slideIndex) => (
            <Link
              key={slide.id}
              href={slide.href}
              dir="rtl"
              className="relative aspect-[16/9] w-full shrink-0 sm:aspect-[21/9]"
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                priority={slideIndex === 0}
                className="object-cover"
                placeholder={slide.imageBlurDataUrl ? "blur" : "empty"}
                blurDataURL={slide.imageBlurDataUrl ?? undefined}
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute inset-0 flex flex-col items-start justify-end gap-2 p-5 sm:p-8">
                <h2 className="text-xl font-bold text-white sm:text-2xl">
                  {slide.title}
                </h2>
                {slide.subtitle && (
                  <p className="max-w-xs text-sm text-white/85 sm:text-base">
                    {slide.subtitle}
                  </p>
                )}
                {slide.ctaLabel && (
                  <span className="mt-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--sf-ink)] sm:text-sm">
                    {slide.ctaLabel}
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* رفلکس محو — خارج از قاب، بلافاصله زیر آن */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full h-10 opacity-[0.12] blur-xl sm:h-14"
          style={{
            transform: "scaleY(-1)",
            backgroundImage: `url(${current.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent)",
            maskImage: "linear-gradient(to bottom, black, transparent)",
          }}
        />
      </div>

      {/* Dot Indicator — پایین و خارج از تصاویر */}
      {banners.length > 1 && (
        <div className="mt-5 flex items-center justify-center gap-1.5 sm:mt-6">
          {banners.map((slide, slideIndex) => (
            <button
              key={slide.id}
              type="button"
              aria-label={`اسلاید ${slideIndex + 1}`}
              aria-current={slideIndex === index}
              onClick={() => goTo(slideIndex)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                slideIndex === index
                  ? "w-5 bg-[var(--color-primary)]"
                  : "w-1.5 bg-gray-300",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
