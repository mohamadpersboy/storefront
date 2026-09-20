import { Minus, Plus } from "lucide-react";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import { computeSelectionTotal } from "@/lib/storefront/product-purchase-math";

type ProductQuantityStepperProps = {
  quantity: number;
  stock: number;
  finalUnitPrice: number;
  onChange: (quantity: number) => void;
};

/**
 * Stepper تعداد + «مبلغ این انتخاب» — هم‌الگو با کارت رفرنس
 * کارفرما. دکمه «+» در `stock` (موجودی همان Variant انتخاب‌شده)
 * غیرفعال می‌شود؛ دکمه «−» در ۱ غیرفعال می‌شود (حداقل تعداد).
 */
export function ProductQuantityStepper({
  quantity,
  stock,
  finalUnitPrice,
  onChange,
}: ProductQuantityStepperProps) {
  const total = computeSelectionTotal(finalUnitPrice, quantity);

  return (
    <div className="flex items-center justify-between rounded-2xl bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs text-gray-500">مبلغ این انتخاب</p>
        <p className="mt-1 text-base font-bold text-[var(--sf-ink)]">
          {formatNumber(total)} <span className="text-xs font-medium">{TOMAN_GLYPH}</span>
        </p>
      </div>

      {/*
        ترتیب DOM عمداً «کم − عدد + زیاد» است، نه برعکس: چون صفحه
        RTL است، اولین فرزند Flex در سمت راست می‌نشیند — پس برای
        اینکه «+» طبق رفرنس در سمت *چپ* Pill دیده شود، باید در DOM
        آخرین فرزند باشد.
      */}
      <div className="flex items-center gap-3 rounded-full bg-gray-100 p-1">
        <button
          type="button"
          onClick={() => onChange(quantity - 1)}
          disabled={quantity <= 1}
          aria-label="کاهش تعداد"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
        <span className="min-w-[1.5rem] text-center text-sm font-bold text-[var(--sf-ink)]">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => onChange(quantity + 1)}
          disabled={quantity >= stock}
          aria-label="افزایش تعداد"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--sf-ink)] shadow-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
