"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  clampProgress,
  progressToHeightCss,
  resolveGestureDirection,
  resolveReleaseProgress,
  resolveSlideIndex,
  scrollYToCollapsingProgress,
  verticalDeltaToProgress,
  type GestureDirection,
} from "@/lib/storefront/product-gallery-math";

export type ProductGalleryImage = {
  url: string;
  /**
   * فعلاً همیشه `null` است — مدل `Product` هنوز `imageBlurDataUrl`
   * ندارد (برخلاف Banner/Category). فیلد اینجا نگه داشته شده تا در
   * صورت افزودن آن به مدل، فقط `get-product-detail.ts` تغییر کند و
   * خود Component بدون تغییر Mesh Blur واقعی را فعال کند.
   */
  blurDataUrl: string | null;
};

type ProductImageGalleryProps = {
  images: ProductGalleryImage[];
  /** برای `alt` تصویر — چون Product Title در این فاز رندر نمی‌شود. */
  productTitle: string;
};

/**
 * گالری تصویر تعاملی صفحه جزئیات محصول — Phase 1.
 *
 * دو نوع ژست روی خود گالری وجود دارد که باید بدون تداخل تشخیص داده
 * شوند (بند ۷ Master Prompt):
 * - افقی → تغییر تصویر فعال (Slider).
 * - عمودی (فقط رو به بالا) → گسترش ارتفاع Container از ۴۰vh به ۶۰vh.
 *
 * ارتفاع با یک عدد بدون‌واحد «Progress» (۰..۱) مدل می‌شود
 * (`product-gallery-math.ts`) — در حین درگ مستقیماً دنبال انگشت
 * کاربر است (بدون CSS Transition، برای پاسخ فوری)، و در لحظه
 * رهاکردن با یک Transition نرم به یکی از دو سر بازه Snap می‌شود.
 *
 * وقتی گالری در حالت باز است، اسکرول صفحه (نه درگ خود گالری) آن را
 * به‌تدریج و متصل به مقدار اسکرول به ۴۰vh برمی‌گرداند (بند ۸).
 *
 * بدون کتابخانه انیمیشن جدید — طبق بند ۱۸: «اگر کتابخانه‌ای از قبل
 * نصب است از همان استفاده کن»؛ چون هیچ‌کدام (Framer Motion و مشابه)
 * در پروژه نصب نیست، از Pointer Events خام + CSS Transform/Transition
 * استفاده شده (GPU-friendly، بدون Re-render غیرضروری در حین درگ —
 * مقدار زنده مستقیم روی DOM با `ref.style` نوشته می‌شود، نه State).
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [loadedFlags, setLoadedFlags] = useState<boolean[]>(() => images.map(() => false));

  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // مقادیر زنده حین درگ — عمداً Ref (نه State) تا در حین Pointer Move
  // Re-render رخ ندهد؛ فقط مستقیم روی Style نوشته می‌شوند.
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    direction: GestureDirection;
    /** Progress ارتفاع در لحظه شروع همین درگ (برای درگ عمودی). */
    startProgress: number;
    /** آخرین Progress محاسبه‌شده حین درگ عمودی — مرجع برای تصمیم Snap. */
    liveProgress: number;
    /** آخرین Delta X حین درگ افقی — مرجع برای تصمیم تغییر تصویر. */
    liveDeltaX: number;
  } | null>(null);

  // Progress فعلی گالری — هم منبع ارتفاع، هم ورودی افکت اسکرول.
  // به‌عنوان State نگه داشته می‌شود چون فقط در لحظات گسسته (شروع/پایان
  // درگ، رویداد اسکرول) تغییر می‌کند، نه هر فریم درگ.
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const scrollBaselineRef = useRef<{ scrollY: number; progressAtStart: number } | null>(null);

  const setProgressBoth = useCallback((next: number) => {
    progressRef.current = next;
    setProgress(next);
  }, []);

  function applyHeight(nextProgress: number) {
    if (containerRef.current) {
      containerRef.current.style.height = progressToHeightCss(nextProgress);
    }
  }

  function applyTrackTransform(index: number, deltaXPx: number) {
    if (trackRef.current) {
      trackRef.current.style.transform = `translateX(calc(${-index * 100}% + ${deltaXPx}px))`;
    }
  }

  // --- اسکرول صفحه: بازگشت تدریجی از حالت باز به ۴۰vh ---
  useEffect(() => {
    function handleScroll() {
      if (isDragging) return;
      if (progressRef.current <= 0 && !scrollBaselineRef.current) return;

      if (!scrollBaselineRef.current) {
        scrollBaselineRef.current = {
          scrollY: window.scrollY,
          progressAtStart: progressRef.current,
        };
      }

      const baseline = scrollBaselineRef.current;
      const scrolledPx = Math.max(0, window.scrollY - baseline.scrollY);
      const next = scrollYToCollapsingProgress(scrolledPx, baseline.progressAtStart);
      setProgressBoth(next);
      applyHeight(next);

      if (next <= 0 || window.scrollY <= baseline.scrollY) {
        scrollBaselineRef.current = null;
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging]);

  // --- شروع ژست (لمس/ماوس/قلم) ---
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== undefined && event.button !== 0) return;
    scrollBaselineRef.current = null;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      direction: null,
      startProgress: progressRef.current,
      liveProgress: progressRef.current,
      liveDeltaX: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - gesture.startX;
    const deltaY = event.clientY - gesture.startY;

    if (gesture.direction === null) {
      const direction = resolveGestureDirection(deltaX, deltaY);
      if (direction === null) return;
      gesture.direction = direction;
      if (direction === "vertical") setIsDragging(true);
    }

    if (gesture.direction === "vertical") {
      // فقط کشیدن رو به بالا معنادار است؛ کشیدن رو به پایین وقتی از
      // قبل در حالت عادی (Progress=۰) هستیم چیزی برای جمع‌کردن ندارد.
      const next = verticalDeltaToProgress(deltaY, gesture.startProgress);
      gesture.liveProgress = next;
      applyHeight(next);
    } else if (gesture.direction === "horizontal") {
      gesture.liveDeltaX = deltaX;
      applyTrackTransform(activeIndex, deltaX);
    }
  }

  function endGesture(event: React.PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;

    if (gesture.direction === "vertical") {
      const finalProgress = clampProgress(resolveReleaseProgress(gesture.liveProgress));
      setProgressBoth(finalProgress);
      // یک فریم صبر می‌کنیم تا Transition (که با کلاس `isDragging=false` فعال می‌شود) واقعاً اعمال شود.
      requestAnimationFrame(() => applyHeight(finalProgress));
      setIsDragging(false);
    } else if (gesture.direction === "horizontal") {
      const nextIndex = resolveSlideIndex(activeIndex, gesture.liveDeltaX, images.length);
      setActiveIndex(nextIndex);
      requestAnimationFrame(() => applyTrackTransform(nextIndex, 0));
    }
  }

  function goToSlide(index: number) {
    setActiveIndex(index);
    applyTrackTransform(index, 0);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (images.length <= 1) return;
    // در RTL، از نظر بصری «چپ» یعنی تصویر بعدی (هم‌جهت با Dot بعدی).
    if (event.key === "ArrowLeft") {
      const next = (activeIndex + 1) % images.length;
      goToSlide(next);
    } else if (event.key === "ArrowRight") {
      const prev = (activeIndex - 1 + images.length) % images.length;
      goToSlide(prev);
    }
  }

  function markLoaded(index: number) {
    setLoadedFlags((current) => {
      if (current[index]) return current;
      const next = [...current];
      next[index] = true;
      return next;
    });
  }

  if (images.length === 0) {
    return (
      <div className="mx-4 flex aspect-[3/4] max-h-[40dvh] items-center justify-center rounded-2xl bg-white text-sm text-gray-400 sm:mx-6">
        تصویری برای این محصول ثبت نشده است
      </div>
    );
  }

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <div
        ref={containerRef}
        role="group"
        aria-roledescription="گالری تصاویر محصول"
        aria-label={`گالری تصاویر ${productTitle}`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        className="relative overflow-hidden rounded-2xl bg-white outline-none focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]"
        style={{
          height: progressToHeightCss(progress),
          transition: isDragging ? "none" : "height 320ms cubic-bezier(0.22, 1, 0.36, 1)",
          touchAction: "pan-y",
        }}
      >
        <div className="flex h-full items-center justify-center">
          <div dir="ltr" className="relative h-full aspect-[3/4] overflow-hidden">
            <div
              ref={trackRef}
              className="flex h-full"
              style={{
                transform: `translateX(${-activeIndex * 100}%)`,
                transition: isDragging ? "none" : "transform 320ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
            >
              {images.map((image, index) => (
                <div key={image.url + index} className="relative h-full w-full shrink-0">
                  {!loadedFlags[index] && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
                    />
                  )}
                  <Image
                    src={image.url}
                    alt={`${productTitle} — تصویر ${index + 1} از ${images.length}`}
                    fill
                    priority={index === 0}
                    draggable={false}
                    placeholder={image.blurDataUrl ? "blur" : "empty"}
                    blurDataURL={image.blurDataUrl ?? undefined}
                    sizes="(min-width: 640px) 448px, 100vw"
                    className={cn(
                      "object-cover transition-opacity duration-300",
                      loadedFlags[index] ? "opacity-100" : "opacity-0",
                    )}
                    onLoad={() => markLoaded(index)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5">
          {images.map((image, index) => (
            <button
              key={image.url + index}
              type="button"
              aria-label={`تصویر ${index + 1}`}
              aria-current={index === activeIndex}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-1.5 rounded-full transition-all",
                index === activeIndex ? "w-5 bg-[var(--sf-accent)]" : "w-1.5 bg-gray-300",
              )}
            />
          ))}
        </div>
      )}
    </section>
  );
}
