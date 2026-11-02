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

/** چرخش اسلاید خروجی: ۴۵ درجه پادساعت‌گرد (منفی)، حول «راست ۱۰۰px». */
const EXIT_ROTATE_DEG = -45;
const EXIT_TRANSFORM_ORIGIN = "right 100px";

type SlideState = "active" | "upcoming" | "exiting" | "hidden";

/**
 * - `active`: روی همه، کامل و واضح.
 * - `exiting`: اسلاید قبلی؛ ۴۵ درجه پادساعت‌گرد حول
 *   `transform-origin: right 100px` می‌چرخد و هم‌زمان `opacity` آن
 *   به ۰ می‌رود (بدون جابه‌جایی X/Y).
 * - `upcoming`: زیر اسلاید فعال، کمی پایین‌تر، کوچک‌تر و Blur.
 * - `hidden`: نامرئی (هم‌ظاهر `upcoming` با `opacity: 0`).
 * وقتی `active` عوض می‌شود، اسلاید `upcoming` به `active` می‌رسد
 * (بالا می‌آید، بزرگ و واضح می‌شود) در حالی که اسلاید قبلی روی آن
 * فقط محو می‌شود.
 */
const slideVariants: Variants = {
  active: { y: 0, scale: 1, rotate: 0, opacity: 1, filter: "blur(0px)" },
  exiting: { y: 0, scale: 1, rotate: EXIT_ROTATE_DEG, opacity: 0, filter: "blur(0px)" },
  upcoming: { y: "8%", scale: 0.9, rotate: 0, opacity: 0.85, filter: "blur(8px)" },
  hidden: { y: "8%", scale: 0.9, rotate: 0, opacity: 0, filter: "blur(8px)" },
};

const RISE_TRANSITION: Transition = {
  // بازگشت چرخش به ۰ فوری است (اسلاید در آن لحظه نامرئی/زیر اسلاید فعال است).
  rotate: { duration: 0 },
  default: { duration: 0.6, ease: [0.22, 0.61, 0.36, 1] },
  opacity: { duration: 0.4, ease: "easeOut" },
  filter: { duration: 0.5, ease: "easeOut" },
};

const FADE_OUT_TRANSITION: Transition = {
  duration: 0.5,
  ease: "easeOut",
};

const REDUCED_TRANSITION: Transition = { duration: 0.01 };

/** متن روی اسلاید: عنوان، زیرعنوان و دکمه یکی‌یکی بالا می‌آیند. */
const captionVariants: Variants = {
  active: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
  upcoming: {},
  exiting: {},
  hidden: {},
};

const captionItemVariants: Variants = {
  active: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  upcoming: { opacity: 0, y: 14 },
  exiting: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 14 },
};

/**
 * Hero Slider صفحه اصلی — همهٔ انیمیشن‌ها با framer-motion.
 *
 * اسلایدها `absolute` روی هم‌اند. هنگام تعویض، اسلاید بالایی ۴۵ درجه
 * پادساعت‌گرد حول `right 100px` می‌چرخد و محو می‌شود و اسلاید زیرین به جای آن بالا می‌آید.
 * وضعیت هر اسلاید (`active`/`exiting`/`upcoming`/`hidden`) از
 * `index` و `exitingIndex` محاسبه و به `animate` داده می‌شود.
 *
 * Swipe با `onPan*` فقط ژست را تشخیص می‌دهد (چیزی جابه‌جا نمی‌شود؛
 * `touch-pan-y` اسکرول عمودی صفحه را آزاد می‌گذارد)؛ کلیک بعد از
 * Swipe لغو می‌شود. Autoplay هر ۵ ثانیه، با هر تغییر ریست و در حین
 * ژست متوقف می‌شود. `initial={false}`: Render سرور همان حالت نهایی
 * است. `prefers-reduced-motion` رعایت می‌شود.
 *
 * داده از `banners` (Props، مدل `Banner`)؛ بدون بنر فعال `null`.
 * Mesh Blur با `placeholder="blur"` خود Next Image.
 */
export function HeroSlider({ banners }: { banners: HeroBannerSlide[] }) {
  const [index, setIndex] = useState(0);
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const didPanRef = useRef(false);
  const reduceMotion = useReducedMotion();

  const length = banners.length;

  useEffect(() => {
    if (length < 2 || isPanning) return;
    const timer = setInterval(() => {
      setExitingIndex(index);
      setIndex((index + 1) % length);
    }, AUTOPLAY_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [length, index, isPanning]);

  if (length === 0) return null;

  function goTo(rawIndex: number) {
    const nextIndex = ((rawIndex % length) + length) % length;
    if (nextIndex === index) return;
    setExitingIndex(index);
    setIndex(nextIndex);
  }

  function handlePanStart() {
    didPanRef.current = false;
    setIsPanning(true);
  }

  function handlePan(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 6) didPanRef.current = true;
  }

  function handlePanEnd(_: unknown, info: PanInfo) {
    setIsPanning(false);
    const far = Math.abs(info.offset.x) > SWIPE_OFFSET_PX;
    const fast = Math.abs(info.velocity.x) > SWIPE_VELOCITY;
    if (!far && !fast) return;
    // کشیدن به راست = قبلی؛ کشیدن به چپ = بعدی.
    goTo(info.offset.x > 0 ? index - 1 : index + 1);
  }

  function stateOf(slideIndex: number): SlideState {
    if (slideIndex === index) return "active";
    if (slideIndex === exitingIndex) return "exiting";
    if (length > 1 && slideIndex === (index + 1) % length) return "upcoming";
    return "hidden";
  }

  const zIndexOf: Record<SlideState, number> = {
    exiting: 3,
    active: 2,
    upcoming: 1,
    hidden: 0,
  };

  return (
    <section className="relative px-4 pt-4 tab:px-6 tab:pt-6">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl tab:aspect-[21/9]">
        <motion.div
          className="absolute inset-0 touch-pan-y"
          onPanStart={length > 1 ? handlePanStart : undefined}
          onPan={length > 1 ? handlePan : undefined}
          onPanEnd={length > 1 ? handlePanEnd : undefined}
        >
          {banners.map((slide, slideIndex) => {
            const state = stateOf(slideIndex);
            const isActive = state === "active";
            const transition = reduceMotion
              ? REDUCED_TRANSITION
              : state === "exiting"
                ? FADE_OUT_TRANSITION
                : RISE_TRANSITION;

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
                initial={false}
                animate={state}
                transition={transition}
                style={{
                  zIndex: zIndexOf[state],
                  transformOrigin: EXIT_TRANSFORM_ORIGIN,
                  pointerEvents: isActive ? "auto" : "none",
                }}
                onAnimationComplete={(definition) => {
                  // بعد از محو کامل، اسلاید قبلی به صف «بعدی» برمی‌گردد.
                  if (definition === "exiting") {
                    setExitingIndex((current) =>
                      current === slideIndex ? null : current,
                    );
                  }
                }}
                onClickCapture={(event) => {
                  if (didPanRef.current) {
                    event.preventDefault();
                    didPanRef.current = false;
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
