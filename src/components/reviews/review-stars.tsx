import { Star } from "lucide-react";
import { toPersianDigits } from "@/lib/utils/format";

export function ReviewStars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`امتیاز ${toPersianDigits(rating)} از ۵`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={n <= rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-zinc-300"}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
