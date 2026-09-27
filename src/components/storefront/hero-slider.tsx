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

const AUTOPLAY_INTERVAL_MS = 5000;
const SWIPE_THRESHOLD_PX = 40;
const TRANSITION_MS = 600;

/**
 * Hero Slider صفحه اصلی — روی همه Breakpoint‌ها نمایش داده می‌شود
 * (برخلاف Top/Bottom Bar که فقط موبایل بودند).
 *
 * داده از `banners` (Props) می‌آید — از یک Fetch واقعی سمت Server در
 * `page.tsx` به مدل واقعی `Banner` (Dashboard → تنظیمات → اسلایدر).
 * هر اسلاید یک تصویر کامل (Cloudinary) است؛ تصویر خودش شامل
 * پس‌زمینه/رنگ طرح است، نه یک گرادیان تولیدشده در کد. اگر هیچ بنر
 * فعالی وجود نداشته باشد، این کامپوننت چیزی رندر نمی‌کند
 * (`return null`) — یک Empty State صادقانه.
 *
 * **ترنزیشن «ورق‌خوردن» (Peel + Rise):** طبق درخواست صریح (رفرنس
 * اسکرین‌شات اپ Blu)، به‌جای اسلاید افقی خطی (`translateX`)، هر
 * اسلاید به‌صورت مطلق (`absolute inset-0`) روی هم قرار می‌گیرد و
 * نقش هرکدام نسبت به `index` فعلی محاسبه می‌شود:
 * - فعال (`rel === 0`): حالت عادی، کاملاً واضح.
 * - بعدی (`rel === 1`): کمی پایین‌تر و Blur، پشت اسلاید فعال منتظر
 *   نوبت (`filter: blur`, `translateY` مثبت, `scale` کوچک‌تر).
 * - در حال خروج (`rel === length-1`، یعنی همان اسلایدی که یک لحظه
 *   پیش فعال بود): با کمی چرخش (`rotate`) و جابه‌جایی، مثل ورق کاغذ
 *   کنار می‌رود و محو می‌شود؛ این لایه عمداً بالاترین `z-index` را
 *   دارد تا هنگام چرخیدن روی اسلاید تازه‌فعال‌شده (که دارد از پشت/
 *   پایین بالا می‌آید) قرار بگیرد.
 * جهت چرخش (`direction`) بر اساس جهت واقعی حرکت (Autoplay/Swipe/
 * کلیک روی نقطه) تعیین می‌شود تا ورق‌خوردن همیشه هم‌جهت با حرکت
 * باشد. چون دیگر از `translateX` استفاده نمی‌شود، نیازی به Override
 * جهت (`dir="ltr"`) هم نیست (برخلاف نسخه قبلی).
 *
 * Swipe لمسی با `onTouchStart/End` (بدون کتابخانه اضافه).
 *
 * Mesh Blur (بند ۲۷-۳۰ Master Workflow): از قابلیت بومی
 * `placeholder="blur"` خود Next.js Image استفاده شده.
 *
 * Dot Indicator: به‌صورت Overlay **داخل خود تصویر** (پایین و
 * وسط‌چین) قرار دارد — طبق بازخورد صریح جدید کارفرما (نسخه قبلی این
 * را بیرون از قاب تصویر می‌گذاشت).
 */
export function HeroSlider({ banners }: { banners: HeroBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  const length = banners.length;

  function goTo(rawIndex: number) {
    const nextIndex = ((rawIndex % length) + length) % length;
    const isForward = (nextIndex - index + length) % length === 1;
    setDirection(isForward ? 1 : -1);
    setIndex(nextIndex);
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

  return (
    <section className="relative px-4 pt-4 sm:px-6 sm:pt-6">
      <div
        className="relative aspect-[16/9] w-full sm:aspect-[21/9]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {banners.map((slide, slideIndex) => {
          const rel = (slideIndex - index + length) % length;
          const isActive = rel === 0;
          const isUpcoming = rel === 1;
          const isExiting = rel === length - 1 && length > 1;

          let transform = "translateY(4%) scale(0.94)";
          let filter = "blur(6px)";
          let opacity = 0;
          let zIndex = 0;

          if (isActive) {
            transform = "translateY(0) scale(1) rotate(0deg)";
            filter = "blur(0px)";
            opacity = 1;
            zIndex = 2;
          } else if (isUpcoming) {
            transform = "translateY(4%) scale(0.94)";
            filter = "blur(6px)";
            opacity = 0.9;
            zIndex = 1;
          } else if (isExiting) {
            const rotateDeg = direction === 1 ? -7 : 7;
            transform = `translateY(-6%) scale(0.97) rotate(${rotateDeg}deg)`;
            filter = "blur(0px)";
            opacity = 0;
            zIndex = 3;
          }

          return (
            <Link
              key={slide.id}
              href={slide.href}
              dir="rtl"
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              className="absolute inset-0 overflow-hidden rounded-2xl"
              style={{
                transform,
                filter,
                opacity,
                zIndex,
                transformOrigin: direction === 1 ? "85% 15%" : "15% 15%",
                transitionProperty: "transform, opacity, filter",
                transitionDuration: `${TRANSITION_MS}ms`,
                transitionTimingFunction: "cubic-bezier(0.22, 0.61, 0.36, 1)",
                pointerEvents: isActive ? "auto" : "none",
              }}
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
          );
        })}

        {/* Dot Indicator — Overlay داخل خود تصویر */}
        {length > 1 && (
          <div className="pointer-events-none absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5 sm:bottom-4">
            {banners.map((slide, slideIndex) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`اسلاید ${slideIndex + 1}`}
                aria-current={slideIndex === index}
                onClick={() => goTo(slideIndex)}
                className={cn(
                  "pointer-events-auto h-1.5 rounded-full transition-all",
                  slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/50",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
