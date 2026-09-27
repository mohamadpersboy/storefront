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

/**
 * Transition جداگانه برای هر ویژگی: `transform` کند و کامل (خروج
 * واقعی از قاب)، ولی `opacity` عمداً خیلی سریع‌تر تمام می‌شود — یعنی
 * اسلاید در حال خروج پس از طی کردن بخش نسبتاً کوچکی از مسیر
 * جابه‌جایی/چرخش کاملاً محو (نامرئی) شده، هرچند از نظر Transform
 * هنوز در حال حرکت است. طبق بازخورد صریح («وقتی ۱۰۰ پیکسل حرکت کرد
 * باید محو بشه»).
 */
const SLIDE_TRANSITION =
  "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 320ms ease-out, filter 450ms ease-out";

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
 *   پیش فعال بود): همزمان چرخش (`rotate`) + حرکت افقی در جهت حرکت
 *   (`translateX`) + یک جابه‌جایی جزئی رو به پایین (`translateY`
 *   مثبت) دارد — مثل ورق کاغذی که هم می‌چرخد هم به کناری پرت
 *   می‌شود. این لایه عمداً بالاترین `z-index` را دارد تا هنگام
 *   چرخیدن روی اسلاید تازه‌فعال‌شده (که دارد از پشت/پایین بالا
 *   می‌آید) قرار بگیرد. جهت چرخش/حرکت (`direction`) بر اساس جهت
 *   واقعی حرکت (Autoplay/Swipe/کلیک روی نقطه) تعیین می‌شود.
 * **محو شدن سریع‌تر از حرکت:** `opacity` عمداً Transition خیلی
 * کوتاه‌تری از `transform` دارد (۳۲۰ در برابر ۶۰۰ میلی‌ثانیه) —
 * یعنی اسلاید در حال خروج پس از طی بخش کوچکی از مسیر واقعی حرکتش
 * کاملاً نامرئی می‌شود، نه فقط در انتهای کل انیمیشن (طبق بازخورد
 * صریح: «وقتی ۱۰۰ پیکسل حرکت کرد باید محو بشه»).
 * چون دیگر از `translateX` روی یک ردیف Flex استفاده نمی‌شود، نیازی
 * به Override جهت (`dir="ltr"`) هم نیست (برخلاف نسخه قبلی).
 *
 * **ریست تایمر Autoplay روی هر تغییر اسلاید:** `useEffect` تایمر
 * به `index` هم وابسته است (نه فقط `banners.length`) — یعنی با هر
 * Swipe یا کلیک روی نقطه، شمارش ۵۰۰۰ میلی‌ثانیه‌ای از صفر شروع
 * می‌شود، طبق درخواست صریح.
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

  // وابستگی به `index`: یعنی با هر تغییر اسلاید — چه از خود
  // Autoplay، چه از Swipe دستی، چه از کلیک روی یک نقطه — تایمر قبلی
  // پاک و از نو شمارش می‌شود. این دقیقاً همان رفتار درخواستی است:
  // «وقتی اسلاید با حرکت دست تغییر کرد، تایمر ریست شود و ۵۰۰۰
  // میلی‌ثانیه بعد اسلاید بعدی ورق بخورد» — بدون این وابستگی، یک
  // Swipe درست قبل از تیک بعدی Autoplay باعث یک تعویض اضافه و خیلی
  // زودهنگام می‌شد.
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % banners.length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [banners.length, index]);

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

          // اسلاید «بعدی در صف»: کمی پایین‌تر (Y+) و کوچک‌تر و Blur —
          // پشت اسلاید فعال منتظر است تا وقتی نوبتش شد بیاید بالاتر،
          // بزرگ‌تر و واضح شود و جای اسلاید قبلی بنشیند.
          let transform = "translateY(8%) scale(0.9)";
          let filter = "blur(8px)";
          let opacity = 0;
          let zIndex = 0;

          if (isActive) {
            transform = "translateX(0) translateY(0) scale(1) rotate(0deg)";
            filter = "blur(0px)";
            opacity = 1;
            zIndex = 2;
          } else if (isUpcoming) {
            transform = "translateY(8%) scale(0.9)";
            filter = "blur(8px)";
            opacity = 0.85;
            zIndex = 1;
          } else if (isExiting) {
            // ورق‌خوردن = چرخش + حرکت افقی در جهت حرکت (Swipe/
            // Autoplay) + یک جابه‌جایی جزئی به سمت پایین در جهت Y —
            // نه فقط چرخش خالی.
            const dirSign = direction === 1 ? 1 : -1;
            transform = `translateX(${dirSign * 110}px) translateY(28px) scale(0.96) rotate(${dirSign * -8}deg)`;
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
                transition: SLIDE_TRANSITION,
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
