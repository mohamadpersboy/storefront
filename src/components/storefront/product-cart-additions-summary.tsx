"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Minus, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, toPersianDigits, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeCartAdditionsTotal, type CartAddition } from "@/lib/storefront/product-purchase-math";

type ProductCartAdditionsSummaryProps = {
  additions: CartAddition[];
  /** فقط بعد از حذف *موفق* واقعی از سبد سرور صدا زده می‌شود. */
  onRemoved: (variantId: string) => void;
  /** فقط بعد از کم شدن *موفق* تعداد در سبد سرور صدا زده می‌شود. */
  onUpdated: (variantId: string, patch: Partial<CartAddition>) => void;
};

/**
 * خلاصه «از این محصول به سبد اضافه شد» — بین Stepper تعداد و کارت
 * توضیحات محصول (طبق دستور دقیق کارفرما). مقدار اولیه‌اش از سبد
 * *واقعی* سرور می‌آید (`getCartAdditionsForProduct` در `page.tsx`،
 * نگاه کنید `ProductPurchasePanel`) — نه یک آرایه خالی، پس با هر
 * Refresh از بین نمی‌رود. از همان‌جا به بعد، هر Variant که از همین
 * صفحه با موفقیت به سبد اضافه شود هم اینجا با تعداد و جمع قیمتش یک
 * ردیف می‌گیرد (`mergeCartAddition` در `ProductPurchasePanel`). تا
 * وقتی چیزی نیست (نه از قبل در سبد، نه تازه اضافه‌شده)، این بخش
 * اصلاً رندر نمی‌شود.
 *
 * **نسخه دوم، طبق اصلاحات دقیق بعدی کارفرما:**
 * - ظاهر حالا دقیقاً هم‌الگو با بقیه کارت‌های صفحه محصول
 *   (`ProductDescriptionCard`): زمینه سفید + `shadow-sm`، بدون
 *   `border-dashed` (نسخه قبلی بدون بک‌گراند با بردر خط‌چین بود).
 * - ردیف «جمع کل سفارش این محصول» و خط جداکننده بالای آن کامل حذف
 *   شدند؛ جمع کل حالا *داخل* دکمه پایین است.
 * - دکمه پایین دیگر شبیه دکمه آبی «افزودن به سبد خرید» نیست — رنگ
 *   `--sf-ink` (سرمه‌ای تیره)، و به دو ناحیه با یک خط جداکننده
 *   عمودی تقسیم شده: سمت راست (اول در DOM، چون RTL) مبلغ جمع کل،
 *   سمت چپ متن «پرداخت» + یک `ChevronLeft` (همان جهت فلش «مشاهده
 *   بیشتر»/«جلوتر» در کل این پروژه — نگاه کنید `SectionHeader`).
 * - کنار هر ردیف Variant یک دکمه گرد با آیکون Minus («−») اضافه شد:
 *   با کلیک، همان Item واقعاً از سبد سرور حذف می‌شود
 *   (`DELETE /api/v1/cart/items/:itemId`، از روی `item.itemId` که
 *   از پاسخ خودِ `POST` قبلی گرفته شده — نه یک شناسه ساختگی)؛ فقط
 *   بعد از پاسخ موفق، `onRemoved(variantId)` صدا زده می‌شود تا
 *   `ProductPurchasePanel` همان ردیف را از فهرست محلی هم پاک کند.
 *
 * **انیمیشن ورود (طبق دستور صریح کارفرما — این بخش نباید یک‌باره
 * ظاهر شود، توضیحات محصول باید با انیمیشن پایین برود):** بدون
 * کتابخانه انیمیشن جدید — از تکنیک استاندارد CSS
 * `grid-template-rows: 0fr → 1fr` استفاده شده (هم‌الگو با تکنیک
 * «Mount، بعد یک فریم بعد Visible=true» که در Bottom Sheet
 * `ProductPriceChartButton` هم هست): چون این بخش داخل جریان عادی
 * صفحه است، رشد ارتفاعش خودش کارت توضیحات را با همان Transition به
 * پایین هل می‌دهد — بدون نیاز به هیچ محاسبه ارتفاع دستی. (این
 * انیمیشن فقط برای Add/Remove *در همین بازدید* اتفاق می‌افتد؛ اگر
 * از قبل چیزی در سبد بود، همان بارگذاری اول صفحه هم `visible=true`
 * می‌شود، چون `hasItems` از همان اول Render `true` است.)
 *
 * **نسخه سوم، طبق دستور دقیق بعدی کارفرما دربارهٔ دکمه:** رنگ دکمه
 * به خانواده آبی قبلی (`--sf-accent`) برگشت (نه سرمه‌ای تیره نسخه
 * قبل)، اما این‌بار به سبک Outline: زمینه آبی شفاف/کم‌رنگ
 * (`bg-[var(--color-primary-soft)]/70`)، مرز و متن پررنگ/تمام‌رنگ
 * (`border-2 border-[var(--color-primary)]`, `text-[var(--color-primary)]`)
 * — نه یک دکمه توپر با متن سفید مثل «افزودن به سبد خرید».
 */
export function ProductCartAdditionsSummary({ additions, onRemoved, onUpdated }: ProductCartAdditionsSummaryProps) {
  const hasItems = additions.length > 0;
  const [visible, setVisible] = useState(false);
  const [pendingItemId, setPendingItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasItems) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    // Cleanup هم وقتی `hasItems` به `false` برمی‌گردد (کاربر آخرین
    // ردیف را حذف کرد) و هم موقع Unmount اجرا می‌شود — `visible` را
    // برای دفعه بعدی که دوباره چیزی اضافه شود ریست می‌کند، بدون
    // فراخوانی مستقیم `setState` داخل بدنه خودِ Effect (قانون
    // ESLint پروژه `react-hooks/set-state-in-effect`).
    return () => {
      cancelAnimationFrame(frame);
      setVisible(false);
    };
  }, [hasItems]);

  if (!hasItems) return null;

  const total = computeCartAdditionsTotal(additions);

  // فقط یک قلم: حذف کامل (DELETE). بیشتر از یکی: یکی کم می‌شود (PATCH).
  async function handleDecrease(item: CartAddition) {
    if (pendingItemId) return;
    setPendingItemId(item.itemId);
    try {
      if (item.quantity <= 1) {
        const response = await fetch(`/api/v1/cart/items/${item.itemId}`, { method: "DELETE" });
        if (response.ok) onRemoved(item.variantId);
        return;
      }

      const response = await fetch(`/api/v1/cart/items/${item.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: item.quantity - 1 }),
      });
      if (!response.ok) return;

      const json = (await response.json().catch(() => null)) as {
        data?: { items?: { id: string; quantity: number; finalUnitPrice: number; isAvailable: boolean }[] };
      } | null;
      const updated = json?.data?.items?.find((i) => i.id === item.itemId);
      onUpdated(
        item.variantId,
        updated
          ? { quantity: updated.quantity, unitPrice: updated.finalUnitPrice, isAvailable: updated.isAvailable }
          : { quantity: item.quantity - 1 },
      );
    } catch {
      // خطای شبکه — فقط بی‌خیال شو، ردیف همچنان نمایش داده می‌شود تا
      // کاربر دوباره تلاش کند؛ پیام خطای مجزا برای این عملیات فرعی
      // طبق دستور کارفرما لازم دیده نشد.
    } finally {
      setPendingItemId(null);
    }
  }

  return (
    <div
      className="grid transition-[grid-template-rows] duration-300 ease-out tab:mx-auto tab:max-w-md"
      style={{ gridTemplateRows: visible ? "1fr" : "0fr" }}
    >
      <div className={cn("overflow-hidden transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}>
        <section className="px-4 pt-4 tab:px-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <ShoppingCart className="h-4 w-4" strokeWidth={1.9} aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-[var(--sf-ink)]">از این محصول به سبد خرید اضافه شده است</p>
            </div>

            <ul className="flex flex-col gap-2.5">
              {additions.map((item) => (
                <li key={item.variantId} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDecrease(item)}
                    disabled={pendingItemId === item.itemId}
                    aria-label={
                      item.quantity <= 1
                        ? `حذف ${item.unitLabel} از سبد خرید`
                        : `کم کردن یک عدد از ${item.unitLabel}`
                    }
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors active:bg-gray-50 disabled:opacity-40"
                  >
                    {item.quantity <= 1 ? (
                      <Trash2 className="size-3.5" strokeWidth={2.25} aria-hidden="true" />
                    ) : (
                      <Minus className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                    )}
                  </button>

                  <span className="shrink-0 text-xs font-semibold text-[var(--sf-ink)]">
                    {item.unitLabel} × {toPersianDigits(item.quantity)}
                  </span>

                  <span
                    aria-hidden="true"
                    className="h-0 flex-1 self-center border-b-2 border-dotted border-gray-300"
                  />

                  {item.isAvailable === false ? (
                    <span className="shrink-0 text-xs font-bold text-red-600">ناموجود شده است</span>
                  ) : (
                    <span className="shrink-0 text-xs font-bold text-[var(--color-primary)]">
                      {formatNumber(item.quantity * item.unitPrice)} {TOMAN_GLYPH}
                    </span>
                  )}
                </li>
              ))}
            </ul>

            <Link
              href="/cart"
              className="mt-4 flex h-12 w-full items-stretch overflow-hidden rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-soft)]/70 text-[var(--color-primary)] transition-colors active:bg-[var(--color-primary-soft)]"
            >
              <span className="flex flex-1 items-center justify-center gap-1 text-sm font-bold">
                {formatNumber(total)}
                <span className="text-[11px] font-medium text-[var(--color-primary)]/80">{TOMAN_GLYPH}</span>
              </span>
              <span aria-hidden="true" className="my-2.5 w-px bg-[var(--color-primary)]/35" />
              <span className="flex items-center gap-1 px-4 text-sm font-bold">
                پرداخت
                <ChevronLeft className="size-4" strokeWidth={2.25} aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
