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

/** عرض هر اسلاید نسبت به عرض کانتینر (همان ۶۰٪ قبلی). */
const SLIDE_WIDTH_RATIO = 0.6;
/** فاصله بین اسلایدها (معادل `gap-3`). */
const GAP_PX = 12;
/** حداقل سرعت (px/s) که یک Swipe سریع را به اسلاید بعدی می‌برد. */
const SWIPE_VELOCITY_PX = 400;
/** حداقل جابه‌جایی (px) که Swipe آرام را به اسلاید بعدی می‌برد. */
const SWIPE_OFFSET_PX = 40;

const SPRING = { type: "spring", stiffness: 320, damping: 36, mass: 0.9 } as const;

/**
 * اسلایدر ساده تصاویر محصول با framer-motion.
 *
 * نسبت (۳:۴) و عرض (۶۰٪ کانتینر) همان گالری قبلی است. فقط Drag افقی
 * و Snap به نزدیک‌ترین تصویر؛ انیمیشن‌های دیگر در فاز بعد.
 * `dir="ltr"`: تصویر اول سمت چپ شروع می‌شود (مثل قبل).
 */
export function ProductImageGallery({ images, productTitle }: ProductImageGalleryProps) {
  const reduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [loaded, setLoaded] = useState<boolean[]>(() => images.map(() => false));

  const count = images.length;
  const slideWidth = containerWidth * SLIDE_WIDTH_RATIO;
  const step = slideWidth + GAP_PX;
  const maxIndex = Math.max(0, count - 1);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // به موقعیت اسلاید فعال برو (با تغییر index یا عرض).
  useEffect(() => {
    if (step <= 0) return;
    const target = -index * step;
    if (reduceMotion) {
      x.set(target);
      return;
    }
    const controls = animate(x, target, SPRING);
    return () => controls.stop();
  }, [index, step, reduceMotion, x]);

  function handleDragEnd(_event: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) {
    // `dir="ltr"`: کشیدن به چپ (offset منفی) = اسلاید بعدی.
    let next = index;
    if (info.velocity.x < -SWIPE_VELOCITY_PX || info.offset.x < -SWIPE_OFFSET_PX) {
      next = index + 1;
    } else if (info.velocity.x > SWIPE_VELOCITY_PX || info.offset.x > SWIPE_OFFSET_PX) {
      next = index - 1;
    }
    next = Math.min(maxIndex, Math.max(0, next));
    if (next === index) {
      // همان اسلاید؛ فقط به جای خود برگردد.
      animate(x, -index * step, SPRING);
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

  const isSingle = count === 1;
  const dragRight = 0;
  const dragLeft = -maxIndex * step;

  return (
    <section className="px-4 pt-4 tab:mx-auto tab:max-w-md tab:px-6">
      <div ref={containerRef} dir="ltr" className="overflow-hidden">
        <motion.div
          className={cn("flex items-start touch-pan-y", isSingle && "justify-center")}
          style={{ x: isSingle ? 0 : x, gap: GAP_PX }}
          drag={isSingle ? false : "x"}
          dragConstraints={{ left: dragLeft, right: dragRight }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={handleDragEnd}
        >
          {images.map((image, i) => (
            <div
              key={image.url + i}
              className="relative aspect-[3/4] shrink-0 overflow-hidden rounded-2xl"
              style={{ width: `${SLIDE_WIDTH_RATIO * 100}%` }}
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
                sizes="60vw"
                className={cn(
                  "select-none object-cover transition-opacity duration-300",
                  loaded[i] ? "opacity-100" : "opacity-0",
                )}
                onLoad={() => markLoaded(i)}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
