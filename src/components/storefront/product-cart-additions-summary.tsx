"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { formatNumber, toPersianDigits, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeCartAdditionsTotal, type CartAddition } from "@/lib/storefront/product-purchase-math";

type ProductCartAdditionsSummaryProps = {
  additions: CartAddition[];
};

/**
 * خلاصه «از همین محصول به سبد اضافه شد» — بین Stepper تعداد و کارت
 * توضیحات محصول (طبق دستور دقیق کارفرما). فقط یک وضعیت محلی همین
 * بازدید صفحه است (نه Fetch از سبد واقعی سرور) — هر Variant که از
 * همین صفحه با موفقیت به سبد اضافه شود، اینجا با تعداد و جمع قیمتش
 * یک ردیف می‌گیرد (`mergeCartAddition` در `ProductPurchasePanel`).
 * تا وقتی چیزی اضافه نشده، این بخش اصلاً رندر نمی‌شود.
 *
 * طبق دستور صریح دربارهٔ ظاهر: بدون بک‌گراند (فقط `border-dashed`
 * دور کل بخش)، و بین برچسب تعداد و قیمت هر ردیف یک خط‌چین
 * (Dot Leader، با یک `<span>` میان‌خالی `border-b-dotted` که فضای
 * باقی‌مانده ردیف را پر می‌کند) — نه یک فاصله خالی ساده.
 */
export function ProductCartAdditionsSummary({ additions }: ProductCartAdditionsSummaryProps) {
  if (additions.length === 0) return null;

  const total = computeCartAdditionsTotal(additions);

  return (
    <section className="px-4 pt-4 sm:mx-auto sm:max-w-md sm:px-6">
      <div className="rounded-2xl border-2 border-dashed border-[var(--sf-accent)]/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--sf-accent-soft)] text-[var(--sf-accent)]">
            <ShoppingBag className="size-3.5" strokeWidth={2} aria-hidden="true" />
          </span>
          <p className="text-xs font-bold text-[var(--sf-ink)]">از این محصول به سبد اضافه شد</p>
        </div>

        <ul className="flex flex-col gap-2">
          {additions.map((item) => (
            <li key={item.variantId} className="flex items-end gap-1.5">
              <span className="shrink-0 text-xs font-semibold text-[var(--sf-ink)]">
                {item.unitLabel} × {toPersianDigits(item.quantity)}
              </span>
              <span
                aria-hidden="true"
                className="mb-1 h-0 flex-1 border-b-2 border-dotted border-gray-300"
              />
              <span className="shrink-0 text-xs font-bold text-[var(--sf-accent)]">
                {formatNumber(item.quantity * item.unitPrice)} {TOMAN_GLYPH}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-3 flex items-end gap-1.5 border-t border-dashed border-gray-200 pt-3">
          <span className="shrink-0 text-sm font-bold text-[var(--sf-ink)]">
            جمع کل سفارش این محصول
          </span>
          <span
            aria-hidden="true"
            className="mb-1 h-0 flex-1 border-b-2 border-dotted border-gray-300"
          />
          <span className="shrink-0 text-sm font-extrabold text-[var(--sf-cherry)]">
            {formatNumber(total)} {TOMAN_GLYPH}
          </span>
        </div>

        <Link
          href="/cart"
          className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--sf-accent)] text-sm font-bold text-white transition-colors active:bg-[var(--sf-accent-hover)]"
        >
          <ShoppingBag className="size-4" strokeWidth={1.9} aria-hidden="true" />
          رفتن به سبد خرید
        </Link>
      </div>
    </section>
  );
}
