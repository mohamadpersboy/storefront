"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { ProductFavoriteButton } from "@/components/storefront/product-favorite-button";
import { ProductPriceChartButton } from "@/components/storefront/product-price-chart-button";
import type { WeeklyPricePoint } from "@/lib/storefront/get-price-history";

type ProductTopBarProps = {
  /** برای Share (عنوان صفحه هنوز در این فاز رندر نمی‌شود — ماژول جداست). */
  shareTitle: string;
  productId: string;
  initialIsFavorite: boolean;
  priceHistory: WeeklyPricePoint[];
};

const COPIED_FEEDBACK_MS = 1500;

/**
 * Top Bar صفحه جزئیات محصول.
 *
 * پنج اکشن دارد:
 *
 * ۱. بازگشت — هم‌الگو با `PageHeader` (`router.back()`، نه یک
 *    مقصد ثابت، چون کاربر ممکن است از مسیرهای مختلف رسیده باشد).
 * ۲. اشتراک‌گذاری — Web Share API روی مرورگرهایی که پشتیبانی می‌کنند
 *    (بیشتر موبایل)، وگرنه Fallback به کپی لینک در Clipboard با
 *    بازخورد کوتاه بصری.
 * ۳. افزودن/حذف از علاقه‌مندی‌ها (`ProductFavoriteButton`) — به
 *    درخواست صریح کارفرما.
 * ۴. نمودار قیمت (`ProductPriceChartButton`) — به درخواست صریح
 *    کارفرما؛ پاپ‌آپ تغییرات ۸ هفته اخیر قیمت.
 *
 * بند «Do NOT design or implement: ... Wishlist» در `page.tsx` مربوط
 * به فاز اولیه صفحه جزئیات محصول بود؛ این دو دکمه با دستور صریح
 * بعدی کارفرما اضافه شدند و آن محدودیت فاز اول را override می‌کنند.
 */
export function ProductTopBar({
  shareTitle,
  productId,
  initialIsFavorite,
  priceHistory,
}: ProductTopBarProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: shareTitle, url });
      } catch {
        // کاربر Share Sheet را بست یا مرورگر رد کرد — نیازی به خطا نیست.
      }
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
      } catch {
        // Clipboard در دسترس نبود (مثلاً Context غیر-Secure) — بی‌صدا نادیده گرفته می‌شود.
      }
    }
  }

  return (
    <div
      className={cn(
        "sticky top-0 z-40",
        "border-b border-black/5 bg-white/75 backdrop-blur-xl",
        "px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)]",
      )}
    >
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="بازگشت"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
        >
          <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </button>

        <div className="flex items-center gap-2">
          <ProductPriceChartButton history={priceHistory} />
          <ProductFavoriteButton productId={productId} initialIsFavorite={initialIsFavorite} />
          <button
            type="button"
            onClick={handleShare}
            aria-label={copied ? "لینک کپی شد" : "اشتراک‌گذاری"}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
          >
            {copied ? (
              <Check className="h-5 w-5 text-[var(--color-success)]" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Share2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
