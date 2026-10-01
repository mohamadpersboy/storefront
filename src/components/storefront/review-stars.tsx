import { Star } from "lucide-react";
import { formatRatingOutOfFive, ratingToFillPercent, REVIEW_MAX_STARS } from "@/lib/storefront/review-summary-format";

const STAR_INDEXES = Array.from({ length: REVIEW_MAX_STARS }, (_, i) => i);

function StarRow({ className }: { className: string }) {
  return (
    <span className="flex w-max gap-0.5">
      {STAR_INDEXES.map((i) => (
        <Star key={i} className={className} strokeWidth={1.5} aria-hidden="true" />
      ))}
    </span>
  );
}

/**
 * نمایش امتیاز با ستاره (فقط مفهوم Rating، بدون Emoji). امتیاز اعشاری
 * (مثلاً ۴.۳) با لایه پرِ بریده‌شده نمایش داده می‌شود؛ لایه از «ابتدای»
 * خط (راست در RTL) شروع می‌شود، پس اولین ستاره همیشه اولین ستاره است.
 */
export function ReviewStars({ rating, className = "size-4" }: { rating: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label={`امتیاز ${formatRatingOutOfFive(rating)}`}
      className="relative inline-block shrink-0 align-middle"
    >
      <StarRow className={`${className} text-gray-300`} />
      <span
        className="absolute start-0 top-0 overflow-hidden"
        style={{ width: `${ratingToFillPercent(rating)}%` }}
      >
        <StarRow className={`${className} fill-amber-400 text-amber-400`} />
      </span>
    </span>
  );
}
