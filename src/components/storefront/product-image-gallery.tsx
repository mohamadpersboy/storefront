"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  getTouchDistance,
  isPinchZoomGesture,
  shouldResetFocusOnScroll,
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

const PINCH_RESET_DELAY_MS = 400;

/**
 * گالری تصویر تعاملی صفحه جزئیات محصول — بازطراحی کامل.
 *
 * بدون کانتینر/بک‌گراند سفید؛ خود تصاویر گوشه‌گرد هستند. اگر فقط یک
 * تصویر باشد، در وسط کانتینر (حداکثر ۶۰٪ عرض آن) قرار می‌گیرد. اگر
 * بیش از یک تصویر باشد، یک لیست افقی Native (اسکرول با انگشت، بدون
 * ردیابی دستی Pointer) نمایش داده می‌شود که تصویر اول در سمت چپ
 * شروع می‌شود و بقیه با فاصله در ادامه (سمت راست) قرار می‌گیرند —
 * دقیقاً مثل `dir="ltr"` در `HeroSlider`، تا در صفحه‌ی RTL هم چیدمان
 * به‌صورت طبیعی از چپ شروع شود.
 *
 * ضربه‌زدن (Tap) یا ژست Pinch-Zoom با دو انگشت روی یک تصویر، آن را
 * «Focus» می‌کند: عرض تا `min(80vw, 90%)` (۸۰٪ عرض صفحه گوشی، ولی
 * هرگز بیشتر از عرض خود کانتینر) بزرگ می‌شود، ارتفاع به‌خاطر
 * `aspect-[3/4]` به همان نسبت رشد می‌کند، و تصویر با اسکرول نرم به
 * وسط دید می‌آید. بقیه تصاویر به‌خاطر همان ردیف Flex به‌طور طبیعی
 * جابه‌جا می‌شوند — بدون نیاز به محاسبه دستی موقعیت. اسکرول *صفحه*
 * (نه خود گالری) رو‌به‌پایین، حالت Focus را بازنشانی می‌کند.
 *
 * بدون کتابخانه انیمیشن جدید (طبق بند ۱۸ Master Prompt) — فقط
 * CSS Transition روی `width` + `scrollIntoView` نرم.
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loadedFlags, setLoadedFlags] = useState<boolean[]>(() => images.map(() => false));

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollYAtFocusRef = useRef(0);
  const pinchRef = useRef<{ index: number; startDistance: number } | null>(null);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);

  // --- بازنشانی Focus با اسکرول رو‌به‌پایین صفحه ---
  useEffect(() => {
    if (focusedIndex === null) return;

    function handleScroll() {
      if (shouldResetFocusOnScroll(scrollYAtFocusRef.current, window.scrollY)) {
        setFocusedIndex(null);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [focusedIndex]);

  // --- وسط‌چین‌کردن تصویر Focus‌شده با اسکرول نرم افقی ---
  useEffect(() => {
    if (focusedIndex === null) return;
    const track = trackRef.current;
    if (!track) return;
    const target = track.children[focusedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [focusedIndex]);

  function focusImage(index: number) {
    scrollYAtFocusRef.current = window.scrollY;
    setFocusedIndex((current) => (current === index ? null : index));
  }

  // --- تشخیص ژست Pinch-Zoom با دو انگشت روی یک تصویر ---
  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>, index: number) {
    if (event.touches.length !== 2) return;
    const [t1, t2] = [event.touches[0], event.touches[1]];
    pinchRef.current = {
      index,
      startDistance: getTouchDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY),
    };
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>) {
    const pinch = pinchRef.current;
    if (!pinch || event.touches.length !== 2) return;
    const [t1, t2] = [event.touches[0], event.touches[1]];
    const currentDistance = getTouchDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
    if (isPinchZoomGesture(pinch.startDistance, currentDistance)) {
      pinchRef.current = null;
      focusImage(pinch.index);
    }
  }

  function handleTouchEnd() {
    // یک تأخیر کوتاه تا `touchend` باقی‌مانده از یک Pinch نیمه‌کاره
    // به‌اشتباه به‌عنوان Tap تفسیر نشود.
    window.setTimeout(() => {
      pinchRef.current = null;
    }, PINCH_RESET_DELAY_MS);
  }

  // --- ضربه‌زدن (Tap/Click) — با آستانه جابه‌جایی، تا بعد از یک
  // اسکرول با انگشت به‌اشتباه Tap تشخیص داده نشود ---
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>, index: number) {
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!start) return;
    const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (movedPx < 6) focusImage(index);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusImage(index);
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
      <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
        <div className="mx-auto flex aspect-[3/4] w-[60%] items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
          تصویری برای این محصول ثبت نشده است
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <div
        ref={trackRef}
        dir="ltr"
        className={cn(
          "flex gap-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          images.length > 1 ? "overflow-x-auto" : "justify-center",
        )}
      >
        {images.map((image, index) => {
          const isFocused = focusedIndex === index;
          return (
            <div
              key={image.url + index}
              role="button"
              tabIndex={0}
              aria-pressed={isFocused}
              aria-label={`${isFocused ? "بستن بزرگ‌نمایی" : "بزرگ‌نمایی"} تصویر ${index + 1} از ${images.length} ${productTitle}`}
              onPointerDown={handlePointerDown}
              onPointerUp={(event) => handlePointerUp(event, index)}
              onTouchStart={(event) => handleTouchStart(event, index)}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={cn(
                "relative aspect-[3/4] shrink-0 cursor-pointer overflow-hidden rounded-2xl outline-none",
                "transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                "focus-visible:ring-2 focus-visible:ring-[var(--sf-accent)]",
                isFocused ? "w-[min(80vw,90%)] shadow-lg" : "w-[60%]",
              )}
            >
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
                sizes="80vw"
                className={cn(
                  "object-cover transition-opacity duration-300",
                  loadedFlags[index] ? "opacity-100" : "opacity-0",
                )}
                onLoad={() => markLoaded(index)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
