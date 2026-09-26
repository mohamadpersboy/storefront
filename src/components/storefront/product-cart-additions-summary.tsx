"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Minus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, toPersianDigits, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeCartAdditionsTotal, type CartAddition } from "@/lib/storefront/product-purchase-math";

type ProductCartAdditionsSummaryProps = {
  additions: CartAddition[];
  /** فقط بعد از حذف *موفق* واقعی از سبد سرور صدا زده می‌شود. */
  onRemoved: (variantId: string) => void;
};

/**
 * خلاصه «از این محصول به سبد اضافه شد» — بین Stepper تعداد و کارت
 * توضیحات محصول (طبق دستور دقیق کارفرما). فقط یک وضعیت محلی همین
 * بازدید صفحه است (نه Fetch از سبد واقعی سرور) — هر Variant که از
 * همین صفحه با موفقیت به سبد اضافه شود، اینجا با تعداد و جمع قیمتش
 * یک ردیف می‌گیرد (`mergeCartAddition` در `ProductPurchasePanel`).
 * تا وقتی چیزی اضافه نشده، این بخش اصلاً رندر نمی‌شود.
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
 * پایین هل می‌دهد — بدون نیاز به هیچ محاسبه ارتفاع دستی.
 */
export function ProductCartAdditionsSummary({ additions, onRemoved }: ProductCartAdditionsSummaryProps) {
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

  async function handleRemove(item: CartAddition) {
    if (pendingItemId) return;
    setPendingItemId(item.itemId);
    try {
      const response = await fetch(`/api/v1/cart/items/${item.itemId}`, { method: "DELETE" });
      if (response.ok) {
        onRemoved(item.variantId);
      }
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
      className="grid transition-[grid-template-rows] duration-300 ease-out sm:mx-auto sm:max-w-md"
      style={{ gridTemplateRows: visible ? "1fr" : "0fr" }}
    >
      <div className={cn("overflow-hidden transition-opacity duration-300", visible ? "opacity-100" : "opacity-0")}>
        <section className="px-4 pt-4 sm:px-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold text-[var(--sf-ink)]">از این محصول به سبد اضافه شد</p>

            <ul className="flex flex-col gap-2.5">
              {additions.map((item) => (
                <li key={item.variantId} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(item)}
                    disabled={pendingItemId === item.itemId}
                    aria-label={`حذف ${item.unitLabel} از سبد خرید`}
                    className="flex size-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-gray-400 transition-colors active:bg-gray-50 disabled:opacity-40"
                  >
                    <Minus className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
                  </button>

                  <span className="shrink-0 text-xs font-semibold text-[var(--sf-ink)]">
                    {item.unitLabel} × {toPersianDigits(item.quantity)}
                  </span>

                  <span
                    aria-hidden="true"
                    className="h-0 flex-1 self-center border-b-2 border-dotted border-gray-300"
                  />

                  <span className="shrink-0 text-xs font-bold text-[var(--sf-accent)]">
                    {formatNumber(item.quantity * item.unitPrice)} {TOMAN_GLYPH}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/cart"
              className="mt-4 flex h-12 w-full items-stretch overflow-hidden rounded-xl bg-[var(--sf-ink)] text-white transition-colors active:bg-[var(--sf-ink-soft)]"
            >
              <span className="flex flex-1 items-center justify-center gap-1 text-sm font-bold">
                {formatNumber(total)}
                <span className="text-[11px] font-medium text-white/70">{TOMAN_GLYPH}</span>
              </span>
              <span aria-hidden="true" className="my-2.5 w-px bg-white/25" />
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
