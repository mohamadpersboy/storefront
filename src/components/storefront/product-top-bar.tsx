"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type ProductTopBarProps = {
  /** برای Share (عنوان صفحه هنوز در این فاز رندر نمی‌شود — ماژول جداست). */
  shareTitle: string;
};

const COPIED_FEEDBACK_MS = 1500;

/**
 * Top Bar صفحه جزئیات محصول — حداقلی، طبق بند ۲ Product Details
 * Phase 1: «Do not invent unnecessary actions». فقط دو اکشن دارد:
 *
 * ۱. بازگشت — هم‌الگو با `PageHeader` (`router.back()`، نه یک
 *    مقصد ثابت، چون کاربر ممکن است از مسیرهای مختلف رسیده باشد).
 * ۲. اشتراک‌گذاری — تنها اکشن معنادار دیگر مستقل از ماژول‌های خارج
 *    از Scope همین فاز (عنوان/قیمت/Variant/افزودن به سبد/
 *    علاقه‌مندی همگی در فازهای بعدی هستند). با Web Share API روی
 *    مرورگرهایی که پشتیبانی می‌کنند (بیشتر موبایل)، وگرنه Fallback
 *    به کپی لینک در Clipboard با بازخورد کوتاه بصری.
 *
 * برخلاف `MobileTopBar` (فقط صفحه اصلی) و مشابه `PageHeader`
 * (صفحات داخلی)، اما بدون عنوان وسط — چون Product Title جزو این
 * فاز نیست و نمایش آن زودتر از موعد گمراه‌کننده است.
 */
export function ProductTopBar({ shareTitle }: ProductTopBarProps) {
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
  );
}
