"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils/cn";
import { getScrollTarget, getScrollTop } from "@/lib/storefront/scroll-container";

export type ProductGalleryImage = {
  url: string;
  /**
   * فعلاً همیشه `null` است — مدل `Product` هنوز `imageBlurDataUrl`
   * ندارد. فیلد برای آینده نگه داشته شده است.
   */
  blurDataUrl: string | null;
};

type ProductImageGalleryProps = {
  images: ProductGalleryImage[];
  productTitle: string;
};

type ZoomState = { index: number; scale: number; panX: number; panY: number };

/** عرض هر اسلاید نسبت به عرض کانتینر. */
const SLIDE_WIDTH_RATIO = 0.6;
/** با کلیک، تصویر ۴۰٪ بزرگ‌تر می‌شود. */
const ZOOM_FACTOR = 1.4;
/** فاصله بین اسلایدها (معادل `gap-3`). */
const GAP_PX = 12;
/** حداقل سرعت (px/s) که یک Swipe سریع را به اسلاید بعدی می‌برد. */
const SWIPE_VELOCITY_PX = 400;
/** حداقل جابه‌جایی (px) که Swipe آرام را به اسلاید بعدی می‌برد. */
const SWIPE_OFFSET_PX = 40;
/** بیشترین بزرگ‌نمایی با دو انگشت. */
const PINCH_MAX_SCALE = 3;
/** اسکرول رو‌به‌پایین صفحه (px) که همه‌چیز را به حالت اول برمی‌گرداند. */
const SCROLL_RESET_PX = 4;

const EASE = [0.22, 1, 0.36, 1] as const;
/** یک Transition مشترک برای عرض و جابه‌جایی، تا هم‌زمان و نرم حرکت کنند. */
const SMOOTH = { duration: 0.5, ease: EASE } as const;
const INSTANT = { duration: 0 } as const;
const ZOOM_RETURN_CSS = "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)";

function touchDistance(a: React.Touch, b: React.Touch) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

function clampPan(value: number, size: number, scale: number) {
  const max = (size * (scale - 1)) / 2;
  return Math.min(max, Math.max(-max, value));
}

/**
 * اسلایدر ساده تصاویر محصول با framer-motion.
 *
 * نسبت ۳:۴؛ عرض هر اسلاید ۶۰٪ کانتینر. کلیک روی تصویر همه اسلایدها را
 * ۴۰٪ بزرگ‌تر می‌کند (۶۰٪ → ۸۴٪)؛ کلیک دوباره برمی‌گرداند. وقتی
 * بزرگ شده‌اند، با دو انگشت می‌توان داخل تصویر زوم کرد و با یک انگشت
 * جابه‌جا شد. اسکرول رو‌به‌پایین صفحه، هم بزرگ‌نمایی و هم زوم را
 * با انیمیشن نرم به حالت اول برمی‌گرداند. بعد از آخرین اسلاید فضای
 * خالی نمی‌ماند، تصویر Tap‌شده هنگام بزرگ/کوچک‌شدن سر جایش (مرکزش) می‌ماند
 * (`computeAnchorX`؛ نه «اولین اسلاید دیده‌شده») و Drag بیرون از انتها (Elastic) ندارد. `dir="ltr"`:
 * تصویر اول سمت چپ شروع می‌شود.
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? INSTANT : SMOOTH;
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  // موقعیت X دلخواه Track بعد از بزرگ/کوچک‌شدن (تا تصویر Tap‌شده سر جایش بماند)؛
  // با Swipe پاک می‌شود و دوباره موقعیت از `index` می‌آید.
  const [anchorX, setAnchorX] = useState<number | null>(null);
  const [zoomed, setZoomed] = useState(false);
  const [zoom, setZoom] = useState<ZoomState | null>(null);
  const [isLiveGesture, setIsLiveGesture] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() => images.map(() => false));

  const pinchRef = useRef<{ index: number; startDistance: number; baseScale: number } | null>(null);
  const panRef = useRef<{ index: number; lastX: number; lastY: number } | null>(null);
  // فقط وقتی واقعاً Pinch/Pan حرکت کرده `true` است؛ با شروع لمس تازه پاک می‌شود.
  const didGestureRef = useRef(false);

  const count = images.length;
  const widthRatio = SLIDE_WIDTH_RATIO * (zoomed ? ZOOM_FACTOR : 1);
  const slideWidth = containerWidth * widthRatio;
  const step = slideWidth + GAP_PX;
  // عرض کل محتوا منهای عرض کانتینر = بیشترین جابه‌جایی مجاز؛ بیشتر از
  // این یعنی فضای خالی بعد از آخرین اسلاید.
  const maxScroll = Math.max(0, count * slideWidth + (count - 1) * GAP_PX - containerWidth);
  const maxIndex = step > 0 ? Math.min(count - 1, Math.ceil(maxScroll / step)) : 0;
  const canScroll = count > 1 && maxScroll > 0;
  const isImageZoomedIn = zoom !== null && zoom.scale > 1.01;
  const hasActiveState = zoomed || zoom !== null;
  const layoutRef = useRef({ containerWidth, slideWidth, step, canScroll, count });
  useEffect(() => {
    layoutRef.current = { containerWidth, slideWidth, step, canScroll, count };
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * موقعیت X جدید Track وقتی عرض اسلایدها عوض می‌شود، به‌طوری که مرکز
   * اسلاید `i` (همان که Tap شده) سر جای فعلی‌اش بماند. قبلاً Track همیشه
   * به «اولین اسلاید دیده‌شده» لنگر می‌شد؛ پس با Tap روی تصویر راست،
   * اسلاید چپ در جایش می‌ماند و تصویر راست از قاب بیرون می‌رفت.
   * نتیجه همیشه داخل بازهٔ مجاز محتوا (بدون فضای خالی) و تصویر کامل
   * داخل دید است. با Transition یکسانِ عرض، مرکز در طول انیمیشن ثابت می‌ماند.
   */
  function computeAnchorX(nextZoomed: boolean, i: number): number | null {
    if (containerWidth <= 0 || count < 2) return null;
    const nextWidth = containerWidth * SLIDE_WIDTH_RATIO * (nextZoomed ? ZOOM_FACTOR : 1);
    const nextStep = nextWidth + GAP_PX;
    const nextMax = Math.max(0, count * nextWidth + (count - 1) * GAP_PX - containerWidth);
    const currentX = canScroll ? x.get() : 0;
    const oldCenter = i * step + currentX + slideWidth / 2;
    const left = Math.min(Math.max(0, oldCenter - nextWidth / 2), containerWidth - nextWidth);
    return Math.min(0, Math.max(-nextMax, left - i * nextStep));
  }
  // نسخهٔ همیشه‌تازه برای Effectهایی که وابستگی‌شان را عمداً محدود نگه داشته‌ایم.
  const computeAnchorXRef = useRef(computeAnchorX);
  useEffect(() => {
    computeAnchorXRef.current = computeAnchorX;
  });

  // به موقعیت دلخواه (بعد از Tap) یا اسلاید فعال برو؛ هرگز بیشتر از انتهای محتوا.
  useEffect(() => {
    if (containerWidth <= 0) return;
    const target = anchorX ?? -Math.min(index * step, maxScroll);
    const controls = animate(x, target, transition);
    return () => controls.stop();
  }, [index, anchorX, step, maxScroll, containerWidth, transition, x]);

  // اسکرول رو‌به‌پایین صفحه → بزرگ‌نمایی و زوم با انیمیشن برمی‌گردند.
  useEffect(() => {
    if (!hasActiveState) return;
    const baseScrollTop = getScrollTop();

    function handleScroll() {
      if (getScrollTop() - baseScrollTop >= SCROLL_RESET_PX) {
        // لنگر: اسلایدی که مرکزش به مرکز قاب نزدیک‌تر است.
        const { containerWidth: cw } = layoutRef.current;
        const currentX = layoutRef.current.canScroll ? x.get() : 0;
        const nearest = Math.round(
          (cw / 2 - currentX - layoutRef.current.slideWidth / 2) / layoutRef.current.step,
        );
        const i = Math.min(layoutRef.current.count - 1, Math.max(0, nearest));
        setAnchorX(computeAnchorXRef.current(false, Number.isFinite(i) ? i : 0));
        setZoomed(false);
        setZoom(null);
      }
    }

    const target = getScrollTarget();
    target.addEventListener("scroll", handleScroll, { passive: true });
    return () => target.removeEventListener("scroll", handleScroll);
  }, [hasActiveState, x]);

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    // `dir="ltr"`: کشیدن به چپ (offset منفی) = اسلاید بعدی. اسلاید شروعِ
    // Drag از موقعیت واقعی Track می‌آید (بعد از Tap ممکن است بین دو
    // اسلاید باشد).
    const startX = x.get() - info.offset.x;
    let next = Math.min(maxIndex, Math.max(0, Math.round(-startX / step)));
    if (info.velocity.x < -SWIPE_VELOCITY_PX || info.offset.x < -SWIPE_OFFSET_PX) {
      next += 1;
    } else if (info.velocity.x > SWIPE_VELOCITY_PX || info.offset.x > SWIPE_OFFSET_PX) {
      next -= 1;
    }
    next = Math.min(maxIndex, Math.max(0, next));
    setAnchorX(null);
    if (next === index) {
      animate(x, -Math.min(index * step, maxScroll), transition);
    } else {
      setIndex(next);
    }
  }

  function toggleZoomed(tappedIndex: number) {
    if (didGestureRef.current) return;
    const nextZoomed = !zoomed;
    setAnchorX(computeAnchorX(nextZoomed, tappedIndex));
    setZoomed(nextZoomed);
    setZoom(null);
  }

  // --- Pinch-Zoom و Pan (فقط وقتی تصاویر بزرگ شده‌اند) ---
  function handleTouchStart(event: React.TouchEvent<HTMLDivElement>, i: number) {
    if (event.touches.length === 1) didGestureRef.current = false;
    if (!zoomed) return;
    const touches = event.touches;
    if (touches.length === 2) {
      const base = zoom && zoom.index === i ? zoom : null;
      pinchRef.current = {
        index: i,
        startDistance: touchDistance(touches[0], touches[1]),
        baseScale: base ? base.scale : 1,
      };
      panRef.current = null;
    } else if (touches.length === 1 && zoom && zoom.index === i && zoom.scale > 1.01) {
      panRef.current = { index: i, lastX: touches[0].clientX, lastY: touches[0].clientY };
    }
    if (pinchRef.current || panRef.current) setIsLiveGesture(true);
  }

  function handleTouchMove(event: React.TouchEvent<HTMLDivElement>, i: number) {
    if (!zoomed) return;
    const el = event.currentTarget;
    const width = el.clientWidth;
    const height = el.clientHeight;
    const touches = event.touches;

    if (touches.length === 2 && pinchRef.current && pinchRef.current.index === i) {
      didGestureRef.current = true;
      const ratio = touchDistance(touches[0], touches[1]) / pinchRef.current.startDistance;
      const scale = Math.min(PINCH_MAX_SCALE, Math.max(1, pinchRef.current.baseScale * ratio));
      setZoom((current) => {
        const panX = current && current.index === i ? current.panX : 0;
        const panY = current && current.index === i ? current.panY : 0;
        return {
          index: i,
          scale,
          panX: clampPan(panX, width, scale),
          panY: clampPan(panY, height, scale),
        };
      });
      return;
    }

    if (touches.length === 1 && panRef.current && panRef.current.index === i) {
      didGestureRef.current = true;
      const dx = touches[0].clientX - panRef.current.lastX;
      const dy = touches[0].clientY - panRef.current.lastY;
      panRef.current.lastX = touches[0].clientX;
      panRef.current.lastY = touches[0].clientY;
      setZoom((current) => {
        if (!current || current.index !== i) return current;
        return {
          index: i,
          scale: current.scale,
          panX: clampPan(current.panX + dx, width, current.scale),
          panY: clampPan(current.panY + dy, height, current.scale),
        };
      });
    }
  }

  function handleTouchEnd(event: React.TouchEvent<HTMLDivElement>, i: number) {
    if (!zoomed) return;
    if (event.touches.length === 0) {
      pinchRef.current = null;
      panRef.current = null;
      setIsLiveGesture(false);
      // اگر تقریباً به اندازه اول برگشته، زوم پاک شود (با انیمیشن).
      setZoom((current) => (current && current.index === i && current.scale <= 1.01 ? null : current));
    } else if (event.touches.length === 1) {
      pinchRef.current = null;
      if (zoom && zoom.index === i && zoom.scale > 1.01) {
        panRef.current = { index: i, lastX: event.touches[0].clientX, lastY: event.touches[0].clientY };
      } else {
        setIsLiveGesture(false);
      }
    }
  }

  function markLoaded(i: number) {
    setLoaded((current) => {
      if (current[i]) return current;
      const next = [...current];
      next[i] = true;
      return next;
    });
  }

  if (count === 0) {
    return (
      <section className="px-4 pt-4 tab:mx-auto tab:max-w-md tab:px-6">
        <div className="mx-auto flex aspect-[3/4] w-[60%] items-center justify-center rounded-2xl border border-dashed border-gray-200 text-sm text-gray-400">
          تصویری برای این محصول ثبت نشده است
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pt-4 tab:mx-auto tab:max-w-md tab:px-6">
      <div ref={containerRef} dir="ltr" className="overflow-hidden">
        <motion.div
          className={cn("flex items-start touch-pan-y", count === 1 && "justify-center")}
          style={{ x: canScroll ? x : 0, gap: GAP_PX }}
          drag={canScroll && !isImageZoomedIn && !isLiveGesture ? "x" : false}
          dragConstraints={{ left: -maxScroll, right: 0 }}
          dragElastic={0}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {images.map((image, i) => {
            const isZoomedHere = zoom !== null && zoom.index === i;
            const scale = isZoomedHere ? zoom.scale : 1;
            const panX = isZoomedHere ? zoom.panX : 0;
            const panY = isZoomedHere ? zoom.panY : 0;

            return (
              <motion.div
                key={image.url + i}
                role="button"
                tabIndex={0}
                aria-pressed={zoomed}
                aria-label={`${zoomed ? "کوچک‌کردن" : "بزرگ‌نمایی"} تصویر ${i + 1} از ${count} ${productTitle}`}
                className="relative aspect-[3/4] shrink-0 cursor-pointer overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                style={{ touchAction: zoomed && (isLiveGesture || isZoomedHere) ? "none" : undefined }}
                initial={false}
                animate={{ width: `${widthRatio * 100}%` }}
                transition={transition}
                onTap={() => toggleZoomed(i)}
                onTouchStart={(event) => handleTouchStart(event, i)}
                onTouchMove={(event) => handleTouchMove(event, i)}
                onTouchEnd={(event) => handleTouchEnd(event, i)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleZoomed(i);
                  }
                }}
              >
                {!loaded[i] && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
                  />
                )}
                <Image
                  src={image.url}
                  alt={`${productTitle} — تصویر ${i + 1} از ${count}`}
                  fill
                  priority={i === 0}
                  draggable={false}
                  placeholder={image.blurDataUrl ? "blur" : "empty"}
                  blurDataURL={image.blurDataUrl ?? undefined}
                  sizes="85vw"
                  className={cn(
                    "select-none object-cover transition-opacity duration-300",
                    loaded[i] ? "opacity-100" : "opacity-0",
                  )}
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${scale})`,
                    transition: `opacity 300ms ease${
                      isLiveGesture || reduceMotion ? "" : `, ${ZOOM_RETURN_CSS}`
                    }`,
                  }}
                  onLoad={() => markLoaded(i)}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
