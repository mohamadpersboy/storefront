"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useReducedMotion,
  type PanInfo,
  type Transition,
  type Variants,
} from "framer-motion";

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
const SWIPE_OFFSET_PX = 40;
const SWIPE_VELOCITY = 300;

const MotionLink = motion.create(Link);

/**
 * Transition هر ویژگی جدا: `opacity` با ۱۸۰ms تأخیر شروع می‌شود تا
 * اسلاید خروجی اول چند پیکسل واقعی حرکت/بچرخد و بعد محو شود.
 */
const SLIDE_TRANSITION: Transition = {
  default: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] },
  opacity: { duration: 0.26, delay: 0.18, ease: "easeOut" },
  filter: { duration: 0.45, ease: "easeOut" },
};

const REDUCED_TRANSITION: Transition = { duration: 0.01 };

type SlideState = "active" | "upcoming" | "exiting" | "hidden";

/**
 * نقش هر اسلاید نسبت به اسلاید فعال (همهٔ انیمیشن‌ها با Variants):
 * - `active`: واضح و کامل.
 * - `upcoming`: کمی پایین‌تر، کوچک‌تر و Blur، پشت اسلاید فعال.
 * - `exiting`: خروج هم‌جهت با Swipe؛ `custom` = جهت (`1` = رفتن به
 *   جلو ← خروج از چپ، چرخش پادساعت‌گرد؛ `-1` برعکس).
 */
const slideVariants: Variants = {
  active: {
    x: 0,
    y: 0,
    scale: 1,
    rotate: 0,
    opacity: 1,
    filter: "blur(0px)",
  },
  upcoming: {
    x: 0,
    y: "8%",
    scale: 0.9,
    rotate: 0,
    opacity: 0.85,
    filter: "blur(8px)",
  },
  exiting: (direction: 1 | -1) => ({
    x: -direction * 120,
    y: 28,
    scale: 0.96,
    rotate: direction * -8,
    opacity: 0,
    filter: "blur(0px)",
  }),
  hidden: {
    x: 0,
    y: "8%",
    scale: 0.9,
    rotate: 0,
    opacity: 0,
    filter: "blur(8px)",
  },
};

/** متن روی اسلاید: عنوان، زیرعنوان و دکمه یکی‌یکی (Stagger) بالا می‌آیند. */
const captionVariants: Variants = {
  active: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  upcoming: {},
  exiting: {},
  hidden: {},
};

const captionItemVariants: Variants = {
  active: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  upcoming: { opacity: 0, y: 14 },
  exiting: { opacity: 0, y: 14, transition: { duration: 0.2 } },
  hidden: { opacity: 0, y: 14 },
};

/**
 * Hero Slider صفحه اصلی — تمام انیمیشن‌ها با framer-motion.
 *
 * - اسلایدها `absolute` روی هم‌اند؛ وضعیت هرکدام (`active` /
 *   `upcoming` / `exiting` / `hidden`) از `index` محاسبه و به
 *   `animate` داده می‌شود (Variants بالا).
 * - Swipe/Drag افقی با `drag="x"` روی یک Wrapper (بازگشت نرم به جای
 *   خود با `dragSnapToOrigin`)؛ اسکرول عمودی صفحه آزاد می‌ماند.
 *   کلیک بعد از Drag لغو می‌شود تا لینک اسلاید اشتباهی باز نشود.
 * - Dot Indicator: عرض و رنگ نقطهٔ فعال با `animate` تغییر می‌کند.
 * - `initial={false}`: Render سرور همان حالت نهایی است (بدون
 *   فلش/پرش در Hydration).
 * - `prefers-reduced-motion` رعایت می‌شود (`useReducedMotion`).
 *
 * داده از `banners` (Props) می‌آید (مدل `Banner`)؛ بدون بنر فعال:
 * `return null`. Mesh Blur با `placeholder="blur"` خود Next Image.
 * Autoplay هر ۵ ثانیه؛ با هر تغییر اسلاید و در حین Drag متوقف/ریست
 * می‌شود.
 */
export function HeroSlider({ banners }: { banners: HeroBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isDragging, setIsDragging] = useState(false);
  const didDragRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const length = banners.length;

  useEffect(() => {
    if (length < 2 || isDragging) return;
    const timer = setInterval(() => {
      setDirection(1);
      setIndex((current) => (current + 1) % length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [length, index, isDragging]);

  if (length === 0) return null;

  function goTo(rawIndex: number) {
    const nextIndex = ((rawIndex % length) + length) % length;
    if (nextIndex === index) return;
    const isForward = (nextIndex - index + length) % length === 1;
    setDirection(isForward ? 1 : -1);
    setIndex(nextIndex);
  }

  function handleDragStart() {
    didDragRef.current = false;
    setIsDragging(true);
  }

  function handleDrag(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) didDragRef.current = true;
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    setIsDragging(false);
    const swipedFar = Math.abs(info.offset.x) > SWIPE_OFFSET_PX;
    const swipedFast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (!swipedFar && !swipedFast) return;
    // کشیدن به راست = اسلاید قبلی؛ کشیدن به چپ = بعدی.
    goTo(info.offset.x > 0 ? index - 1 : index + 1);
  }

  function stateOf(slideIndex: number): SlideState {
    const rel = (slideIndex - index + length) % length;
    if (rel === 0) return "active";
    if (length > 1 && rel === 1) return "upcoming";
    if (length > 1 && rel === length - 1) return "exiting";
    return "hidden";
  }

  const transition = reduceMotion ? REDUCED_TRANSITION : SLIDE_TRANSITION;

  return (
    <section className="relative px-4 pt-4 tab:px-6 tab:pt-6">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl tab:aspect-[21/9]">
        <motion.div
          className="absolute inset-0"
          drag={length > 1 ? "x" : false}
          dragSnapToOrigin
          dragElastic={0.15}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
        >
          {banners.map((slide, slideIndex) => {
            const state = stateOf(slideIndex);
            const isActive = state === "active";
            const zIndex =
              state === "exiting" ? 3 : state === "active" ? 2 : state === "upcoming" ? 1 : 0;

            return (
              <MotionLink
                key={slide.id}
                href={slide.href}
                dir="rtl"
                draggable={false}
                aria-hidden={!isActive}
                tabIndex={isActive ? 0 : -1}
                className="absolute inset-0 overflow-hidden rounded-2xl"
                variants={slideVariants}
                custom={direction}
                initial={false}
                animate={state}
                transition={transition}
                style={{
                  zIndex,
                  pointerEvents: isActive ? "auto" : "none",
                  transformOrigin: direction === 1 ? "85% 15%" : "15% 15%",
                }}
                onClickCapture={(event) => {
                  if (didDragRef.current) {
                    event.preventDefault();
                    didDragRef.current = false;
                  }
                }}
              >
                <Image
                  src={slide.imageUrl}
                  alt={slide.title}
                  fill
                  priority={slideIndex === 0}
                  draggable={false}
                  className="object-cover"
                  placeholder={slide.imageBlurDataUrl ? "blur" : "empty"}
                  blurDataURL={slide.imageBlurDataUrl ?? undefined}
                  sizes="100vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                <motion.div
                  className="absolute inset-0 flex flex-col items-start justify-end gap-2 p-5 tab:p-8"
                  variants={captionVariants}
                >
                  <motion.h2
                    variants={captionItemVariants}
                    className="text-xl font-bold text-white tab:text-2xl"
                  >
                    {slide.title}
                  </motion.h2>
                  {slide.subtitle && (
                    <motion.p
                      variants={captionItemVariants}
                      className="max-w-xs text-sm text-white/85 tab:text-base"
                    >
                      {slide.subtitle}
                    </motion.p>
                  )}
                  {slide.ctaLabel && (
                    <motion.span
                      variants={captionItemVariants}
                      className="mt-1 rounded-full bg-white px-4 py-2 text-xs font-semibold text-[var(--sf-ink)] tab:text-sm"
                    >
                      {slide.ctaLabel}
                    </motion.span>
                  )}
                </motion.div>
              </MotionLink>
            );
          })}
        </motion.div>
      </div>

      {/* Dot Indicator — پایین و خارج از تصاویر */}
      {length > 1 && (
        <div className="mt-2 flex items-center justify-center gap-1.5 tab:mt-3">
          {banners.map((slide, slideIndex) => {
            const active = slideIndex === index;
            return (
              <motion.button
                key={slide.id}
                type="button"
                aria-label={`اسلاید ${slideIndex + 1}`}
                aria-current={active}
                onClick={() => goTo(slideIndex)}
                className="relative h-1.5 rounded-full bg-gray-300"
                initial={false}
                animate={{ width: active ? 20 : 6 }}
                transition={
                  reduceMotion
                    ? REDUCED_TRANSITION
                    : { type: "spring", stiffness: 500, damping: 35 }
                }
                whileTap={{ scale: 0.85 }}
              >
                <motion.span
                  className="absolute inset-0 rounded-full bg-[var(--color-primary)]"
                  initial={false}
                  animate={{ opacity: active ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0.01 : 0.25 }}
                />
              </motion.button>
            );
          })}
        </div>
      )}
    </section>
  );
}
