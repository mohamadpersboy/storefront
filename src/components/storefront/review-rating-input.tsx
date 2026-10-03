"use client";

import { useRef } from "react";
import { Star } from "lucide-react";
import {
  REVIEW_MAX_RATING,
  REVIEW_MIN_RATING,
  nextRatingForKey,
} from "@/lib/storefront/review-form";
import { toPersianDigits } from "@/lib/utils/format";

const VALUES = Array.from(
  { length: REVIEW_MAX_RATING },
  (_, i) => i + REVIEW_MIN_RATING,
);

/**
 * انتخاب امتیاز ۱ تا ۵ (Radiogroup). در RTL ستاره ۱ سمت راست است.
 * Roving tabindex: فقط گزینه فعال (یا اولی) Tab می‌گیرد؛ ArrowLeft = بعدی،
 * ArrowRight = قبلی، Home/End = اول/آخر.
 */
export function ReviewRatingInput({
  value,
  onChange,
  disabled,
  labelledBy,
  invalid,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  labelledBy: string;
  invalid?: boolean;
}) {
  const groupRef = useRef<HTMLDivElement>(null);

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    const next = nextRatingForKey(value, event.key);
    if (next === null) return;
    event.preventDefault();
    onChange(next);
    groupRef.current
      ?.querySelector<HTMLElement>(`[data-value="${next}"]`)
      ?.focus();
  }

  return (
    <div
      ref={groupRef}
      role="radiogroup"
      aria-labelledby={labelledBy}
      aria-required="true"
      aria-invalid={invalid || undefined}
      onKeyDown={handleKeyDown}
      className="flex w-max gap-1"
    >
      {VALUES.map((n) => {
        const checked = value === n;
        const filled = value !== null && n <= value;
        const tabbable = value === null ? n === REVIEW_MIN_RATING : checked;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            data-value={n}
            aria-checked={checked}
            aria-label={`${toPersianDigits(n)} از ${toPersianDigits(REVIEW_MAX_RATING)}`}
            tabIndex={tabbable ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(n)}
            className="rounded-md p-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sf-accent)] disabled:opacity-50"
          >
            <Star
              className={`size-7 ${filled ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
              strokeWidth={1.5}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
