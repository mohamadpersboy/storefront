"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from "framer-motion";
import { cn } from "@/lib/utils/cn";

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

/** یک Transition مشترک برای عرض و جابه‌جایی، تا هم‌زمان و نرم حرکت کنند. */
const SMOOTH = { duration: 0.5, ease: [0.22, 1, 0.36, 1] } as const;
const INSTANT = { duration: 0 } as const;

/**
 * اسلایدر ساده تصاویر محصول با framer-motion.
 *
 * نسبت ۳:۴؛ عرض هر اسلاید ۶۰٪ کانتینر. با کلیک روی تصویر، همه
 * اسلایدها ۴۰٪ بزرگ‌تر می‌شوند (۶۰٪ → ۸۴٪) و با کلیک دوباره برمی‌گردند.
 * بعد از آخرین اسلاید فضای خالی نمی‌ماند (حد Scroll از عرض کل محتوا
 * محاسبه می‌شود). `dir="ltr"`: تصویر اول سمت چپ شروع می‌شود.
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? INSTANT : SMOOTH;
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [loaded, setLoaded] = useState<boolean[]>(() => images.map(() => false));

  const count = images.length;
  const widthRatio = SLIDE_WIDTH_RATIO * (zoomed ? ZOOM_FACTOR : 1);
  const slideWidth = containerWidth * widthRatio;
  const step = slideWidth + GAP_PX;
  // عرض کل محتوا منهای عرض کانتینر = بیشترین جابه‌جایی مجاز؛ بیشتر از
  // این یعنی فضای خالی بعد از آخرین اسلاید.
  const maxScroll = Math.max(0, count * slideWidth + (count - 1) * GAP_PX - containerWidth);
  const maxIndex = step > 0 ? Math.min(count - 1, Math.ceil(maxScroll / step)) : 0;
  const canScroll = count > 1 && maxScroll > 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // به موقعیت اسلاید فعال برو؛ هرگز بیشتر از انتهای محتوا.
  useEffect(() => {
    if (containerWidth <= 0) return;
    const target = -Math.min(index * step, maxScroll);
    const controls = animate(x, target, transition);
    return () => controls.stop();
  }, [index, step, maxScroll, containerWidth, transition, x]);

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    // `dir="ltr"`: کشیدن به چپ (offset منفی) = اسلاید بعدی.
    let next = Math.min(index, maxIndex);
    if (info.velocity.x < -SWIPE_VELOCITY_PX || info.offset.x < -SWIPE_OFFSET_PX) {
      next += 1;
    } else if (info.velocity.x > SWIPE_VELOCITY_PX || info.offset.x > SWIPE_OFFSET_PX) {
      next -= 1;
    }
    next = Math.min(maxIndex, Math.max(0, next));
    if (next === index) {
      animate(x, -Math.min(index * step, maxScroll), transition);
    } else {
      setIndex(next);
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
          drag={canScroll ? "x" : false}
          dragConstraints={{ left: -maxScroll, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {images.map((image, i) => (
            <motion.div
              key={image.url + i}
              role="button"
              tabIndex={0}
              aria-pressed={zoomed}
              aria-label={`${zoomed ? "کوچک‌کردن" : "بزرگ‌نمایی"} تصویر ${i + 1} از ${count} ${productTitle}`}
              className="relative aspect-[3/4] shrink-0 cursor-pointer overflow-hidden rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              initial={false}
              animate={{ width: `${widthRatio * 100}%` }}
              transition={transition}
              onTap={() => setZoomed((current) => !current)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setZoomed((current) => !current);
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
                onLoad={() => markLoaded(i)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
