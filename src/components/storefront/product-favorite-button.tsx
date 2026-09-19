"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProductFavoriteButtonProps = {
  productId: string;
  initialIsFavorite: boolean;
};

/**
 * دکمه افزودن/حذف محصول از علاقه‌مندی‌ها (Watchlist) — کنار دکمه
 * اشتراک‌گذاری در Top Bar (به درخواست صریح کارفرما).
 *
 * Optimistic UI: بلافاصله حالت را برعکس می‌کند، بعد درخواست را
 * می‌فرستد؛ اگر شکست خورد، حالت به عقب برمی‌گردد. کاربر مهمان (پاسخ
 * ۴۰۱) به `/login` هدایت می‌شود — این صفحه فعلاً پارامتر بازگشت
 * ندارد، پس فقط به خودِ صفحه Login می‌رود.
 *
 * Backend: مدل `Favorite` جدید + `POST /api/v1/favorites/toggle` —
 * این دو طبق یادداشت از قبل مستند در CLAUDE.md («این‌ها باید به‌عنوان
 * بخشی از خودِ کار Storefront ساخته شوند») اضافه شدند، نه یک تصمیم
 * معماری جدا که نیاز به اجازه اضافه داشته باشد.
 */
export function ProductFavoriteButton({ productId, initialIsFavorite }: ProductFavoriteButtonProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending) return;
    const next = !isFavorite;
    setIsFavorite(next);
    setPending(true);

    try {
      const response = await fetch("/api/v1/favorites/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });

      if (response.status === 401) {
        setIsFavorite(!next);
        router.push("/login");
        return;
      }

      if (!response.ok) {
        setIsFavorite(!next);
      }
    } catch {
      setIsFavorite(!next);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={isFavorite}
      aria-label={isFavorite ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          isFavorite && "fill-[var(--sf-cherry)] text-[var(--sf-cherry)]",
        )}
        strokeWidth={1.75}
        aria-hidden="true"
      />
    </button>
  );
}
