"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeSelectionTotal } from "@/lib/storefront/product-purchase-math";

type ProductAddToCartBarProps = {
  productId: string;
  variantId: string;
  quantity: number;
  finalUnitPrice: number;
  isOutOfStock: boolean;
};

const SUCCESS_FEEDBACK_MS = 1500;

/**
 * نوار پایین چسبان مخصوص صفحه محصول («مبلغ قابل پرداخت» + دکمه
 * افزودن به سبد) — جایگزین `MobileBottomBar` سراسری روی همین صفحه
 * (نگاه کنید `StorefrontChrome`)، هم‌الگو با رفرنس کارفرما.
 *
 * به `POST /api/v1/cart/items` واقعی وصل است (همان مدل/Route Cart
 * که از قبل کامل ساخته شده — نه Mock). خطای برگشتی از خودِ API
 * (مثلاً «موجودی کافی نیست…») مستقیم به کاربر نشان داده می‌شود، نه
 * یک پیام عمومی. کاربر مهمان (۴۰۱) به `/login` هدایت می‌شود.
 */
export function ProductAddToCartBar({
  productId,
  variantId,
  quantity,
  finalUnitPrice,
  isOutOfStock,
}: ProductAddToCartBarProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const total = computeSelectionTotal(finalUnitPrice, quantity);

  async function handleAddToCart() {
    if (pending || isOutOfStock) return;
    setPending(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/v1/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId, quantity }),
      });

      if (response.status === 401) {
        router.push("/login");
        return;
      }

      const body = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setErrorMessage(body?.message ?? "افزودن به سبد خرید انجام نشد");
        return;
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), SUCCESS_FEEDBACK_MS);
    } catch {
      setErrorMessage("خطا در برقراری ارتباط — دوباره تلاش کنید");
    } finally {
      setPending(false);
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40",
        "border-t border-black/5 bg-white/95 backdrop-blur-xl",
        "px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3",
      )}
    >
      {errorMessage && <p className="mb-2 text-xs font-medium text-[var(--sf-cherry)]">{errorMessage}</p>}

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] text-gray-500">مبلغ قابل پرداخت</p>
          <p className="text-sm font-bold text-[var(--sf-ink)]">
            {formatNumber(total)} <span className="text-[10px] font-medium">{TOMAN_GLYPH}</span>
          </p>
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={pending || isOutOfStock}
          className={cn(
            "flex h-12 flex-1 max-w-[220px] items-center justify-center gap-2 rounded-2xl text-sm font-bold text-white transition-colors",
            isOutOfStock
              ? "cursor-not-allowed bg-gray-300"
              : success
                ? "bg-[var(--color-success)]"
                : "bg-[var(--sf-accent)] active:bg-[var(--sf-accent-hover)]",
            pending && "opacity-70",
          )}
        >
          {isOutOfStock ? (
            "ناموجود"
          ) : success ? (
            <>
              <Check className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
              افزوده شد
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
              افزودن به سبد خرید
            </>
          )}
        </button>
      </div>
    </div>
  );
}
