"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import {
  clampPanOffsetPx,
  clampZoomScale,
  getTouchDistance,
  shouldResetFocusOnScroll,
  ZOOM_MIN_SCALE,
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

type ZoomState = { index: number; scale: number; panX: number; panY: number };

const TAP_MOVE_THRESHOLD_PX = 6;

/**
 * گالری تصویر تعاملی صفحه جزئیات محصول.
 *
 * بدون کانتینر/بک‌گراند سفید؛ خود تصاویر گوشه‌گرد هستند. اگر فقط یک
 * تصویر باشد، در وسط کانتینر (حداکثر ۶۰٪ عرض آن) قرار می‌گیرد. اگر
 * بیش از یک تصویر باشد، یک لیست افقی Native (اسکرول با انگشت) نمایش
 * داده می‌شود که تصویر اول در سمت چپ شروع می‌شود و بقیه با فاصله در
 * ادامه (سمت راست) قرار می‌گیرند — `dir="ltr"` مثل `HeroSlider`، تا
 * در صفحه RTL هم چیدمان از چپ شروع شود. `items-start` روی ردیف Flex
 * عمداً لازم است — بدون آن، Stretch پیش‌فرض Flexbox باعث می‌شود همه
 * اسلایدها با ارتفاع بلندترین (یعنی اسلاید Focus‌شده) کشیده/برش
 * بخورند؛ با `items-start` هر اسلاید فقط با عرض/نسبت خودش
 * (`aspect-[3/4]`) بلند می‌شود.
 *
 * دو ژست کاملاً مستقل روی هر تصویر:
 *
 * ۱. **Tap** → آن تصویر را «Focus» می‌کند: عرض اسلاید تا
 *    `min(80vw, 90%)` بزرگ می‌شود (۸۰٪ عرض صفحه گوشی، هرگز بیشتر از
 *    عرض کانتینر)، ارتفاع به‌خاطر `aspect-[3/4]` به همان نسبت رشد
 *    می‌کند، و با `scrollIntoView` نرم به وسط می‌آید. Tap دوباره روی
 *    همان تصویر آن را به اندازه اولیه برمی‌گرداند (Toggle).
 * ۲. **Pinch با دو انگشت** → اندازه خود اسلاید/Layout را تغییر
 *    نمی‌دهد؛ به‌جایش محتوای تصویر *داخل همان کانتینر* Zoom می‌شود
 *    (`transform: translate() scale()` روی خود `<Image>`، کانتینر
 *    `overflow-hidden` دارد) و با یک انگشت (وقتی Zoom‌شده) می‌توان
 *    نقاط مختلف تصویر را Pan/جابه‌جا کرد — جابه‌جایی همیشه محدود به
 *    لبه‌های تصویر است (`clampPanOffsetPx`، بدون فاصله خالی).
 *
 * اسکرول *صفحه* (نه خود گالری) رو‌به‌پایین، هم Focus و هم Zoom را
 * بازنشانی می‌کند. وقتی تصویری Zoom‌شده، اسکرول افقی گالری موقتاً
 * غیرفعال می‌شود تا با ژست Pan یک‌انگشتی تداخل نکند.
 *
 * بدون کتابخانه انیمیشن جدید (طبق بند ۱۸ Master Prompt) — فقط
 * CSS Transition/Transform + Touch/Pointer Events خام.
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const [loadedFlags, setLoadedFlags] = useState<boolean[]>(() => images.map(() => false));
  // فقط برای تصمیم Transition روی Transform زوم — `true` حین خود
  // ژست (Pinch/Pan زنده، بدون تأخیر CSS)، `false` بعد از رهاکردن
  // (برگشت نرم). عمداً State است، نه خواندن مستقیم Ref حین Render.
  const [isLiveGesture, setIsLiveGesture] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const scrollYAtActiveRef = useRef(0);
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null);
  const pinchRef = useRef<{
    index: number;
    startDistance: number;
    baseScale: number;
    basePanX: number;
    basePanY: number;
  } | null>(null);
  const panRef = useRef<{ index: number; lastX: number; lastY: number } | null>(null);

  const hasActiveState = focusedIndex !== null || zoom !== null;

  // --- بازنشانی Focus/Zoom با اسکرول رو‌به‌پایین صفحه ---
  useEffect(() => {
    if (!hasActiveState) return;

    function handleScroll() {
      if (shouldResetFocusOnScroll(scrollYAtActiveRef.current, window.scrollY)) {
        setFocusedIndex(null);
        setZoom(null);
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasActiveState]);

  // --- وسط‌چین‌کردن تصویر Focus‌شده با اسکرول نرم افقی ---
  useEffect(() => {
    if (focusedIndex === null) return;
    const track = trackRef.current;
    if (!track) return;
    const target = track.children[focusedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [focusedIndex]);

  function focusImage(index: number) {
    scrollYAtActiveRef.current = window.scrollY;
    setZoom(null);
    setFocusedIndex((current) => (current === index ? null : index));
  }

  // --- ضربه‌زدن (Tap/Click) — با آستانه جابه‌جایی، تا بعد از یک
  // اسکرول/Pinch/Pan با انگشت به‌اشتباه Tap تشخیص داده نشود ---
  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    pointerDownRef.current = { x: event.clientX, y: event.clientY };
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>, index: number) {
    const start = pointerDownRef.current;
    pointerDownRef.current = null;
    if (!start || pinchRef.current || panRef.current) return;
    const movedPx = Math.hypot(event.clientX - start.x, event.clientY - start.y);
    if (movedPx >= TAP_MOVE_THRESHOLD_PX) return;

    // اگر تصویری Zoom‌شده، اولین Tap فقط همان را می‌بندد (رفتار
    // مرسوم Viewer عکس)؛ Focus را در همین ضربه تغییر نمی‌دهد.
    if (zoom !== null) {
      setZoom(null);
      return;
    }
    focusImage(index);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>, index: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      focusImage(index);
    }
  }

  // --- Pinch-Zoom-and-Pan داخل کانتینر خود تصویر ---
  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>, index: number) {
    const container = event.currentTarget;
    if (event.touches.length === 2) {
      const [t1, t2] = [event.touches[0], event.touches[1]];
      const current = zoom && zoom.index === index ? zoom : { scale: ZOOM_MIN_SCALE, panX: 0, panY: 0 };
      pinchRef.current = {
        index,
        startDistance: getTouchDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY),
        baseScale: current.scale,
        basePanX: current.panX,
        basePanY: current.panY,
      };
      panRef.current = null;
    } else if (event.touches.length === 1) {
      const current = zoom && zoom.index === index ? zoom : null;
      if (current && current.scale > ZOOM_MIN_SCALE + 0.01) {
        panRef.current = { index, lastX: event.touches[0].clientX, lastY: event.touches[0].clientY };
      }
    }
    if (pinchRef.current || panRef.current) setIsLiveGesture(true);
    void container;
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>, index: number) {
    const container = event.currentTarget;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (event.touches.length === 2 && pinchRef.current && pinchRef.current.index === index) {
      const [t1, t2] = [event.touches[0], event.touches[1]];
      const currentDistance = getTouchDistance(t1.clientX, t1.clientY, t2.clientX, t2.clientY);
      const scale = clampZoomScale(
        pinchRef.current.baseScale * (currentDistance / pinchRef.current.startDistance),
      );
      const panX = clampPanOffsetPx(pinchRef.current.basePanX, containerWidth, scale);
      const panY = clampPanOffsetPx(pinchRef.current.basePanY, containerHeight, scale);
      setZoom({ index, scale, panX, panY });
      return;
    }

    if (event.touches.length === 1 && panRef.current && panRef.current.index === index) {
      const touch = event.touches[0];
      const dx = touch.clientX - panRef.current.lastX;
      const dy = touch.clientY - panRef.current.lastY;
      panRef.current.lastX = touch.clientX;
      panRef.current.lastY = touch.clientY;
      setZoom((current) => {
        if (!current || current.index !== index) return current;
        return {
          index,
          scale: current.scale,
          panX: clampPanOffsetPx(current.panX + dx / current.scale, containerWidth, current.scale),
          panY: clampPanOffsetPx(current.panY + dy / current.scale, containerHeight, current.scale),
        };
      });
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>, index: number) {
    if (event.touches.length === 0) {
      pinchRef.current = null;
      panRef.current = null;
      setIsLiveGesture(false);
      scrollYAtActiveRef.current = window.scrollY;
      setZoom((current) => {
        if (!current || current.index !== index) return current;
        return current.scale <= ZOOM_MIN_SCALE + 0.01 ? null : current;
      });
    } else if (event.touches.length === 1) {
      // یک انگشت از دو انگشت Pinch جدا شده — اگر هنوز Zoom هستیم،
      // ادامه به‌صورت Pan با همان انگشت باقی‌مانده.
      pinchRef.current = null;
      if (zoom && zoom.index === index && zoom.scale > ZOOM_MIN_SCALE + 0.01) {
        panRef.current = { index, lastX: event.touches[0].clientX, lastY: event.touches[0].clientY };
      } else {
        setIsLiveGesture(false);
      }
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

  const isTrackScrollLocked = zoom !== null && zoom.scale > ZOOM_MIN_SCALE + 0.01;

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <div
        ref={trackRef}
        dir="ltr"
        className={cn(
          "flex items-start gap-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden",
          images.length > 1 && !isTrackScrollLocked ? "overflow-x-auto" : "overflow-x-hidden",
          images.length === 1 && "justify-center",
        )}
      >
        {images.map((image, index) => {
          const isFocused = focusedIndex === index;
          const isZoomedHere = zoom !== null && zoom.index === index;
          const zoomScale = isZoomedHere ? zoom.scale : ZOOM_MIN_SCALE;
          const zoomPanX = isZoomedHere ? zoom.panX : 0;
          const zoomPanY = isZoomedHere ? zoom.panY : 0;

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
              onTouchMove={(event) => handleTouchMove(event, index)}
              onTouchEnd={(event) => handleTouchEnd(event, index)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              style={{ touchAction: isZoomedHere && zoomScale > ZOOM_MIN_SCALE + 0.01 ? "none" : undefined }}
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
                style={{
                  transform: `translate(${zoomPanX}px, ${zoomPanY}px) scale(${zoomScale})`,
                  transition: isLiveGesture ? "none" : "transform 200ms ease-out",
                }}
                onLoad={() => markLoaded(index)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
