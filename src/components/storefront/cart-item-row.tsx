import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";

export type CartItemData = {
  id: string;
  product: { id: string; title: string; slug: string; image: string | null } | null;
  quantity: number;
  unit: string;
  finalUnitPrice: number;
  unitPrice: number;
  itemTotal: number;
  isAvailable: boolean;
  unavailableReason: string | null;
};

type CartItemRowProps = {
  item: CartItemData;
  pending: boolean;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
};

/**
 * یک ردیف Item در سبد خرید — طبق رفرنس کارفرما (عکس/عنوان/واحد در
 * راست، تعداد و قیمت در چپ)، اما با تخفیف واقعی هر Item (نه یک عدد
 * ثابت) و وضعیت «در دسترس نیست» که مستقیم از `isAvailable`/
 * `unavailableReason` واقعی Backend می‌آید (بند ۱۵-۱۶ سند Audit) —
 * نه یک حدس سمت Client.
 */
export function CartItemRow({ item, pending, onQuantityChange, onRemove }: CartItemRowProps) {
  const hasDiscount = item.finalUnitPrice < item.unitPrice;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-white",
        item.isAvailable ? "border-black/5" : "border-red-200",
      )}
    >
      <div className={cn("flex gap-3 p-3", !item.isAvailable && "opacity-60")}>
        <div className="relative size-20 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-gray-100">
          {item.product?.image ? (
            <Image
              src={item.product.image}
              alt={item.product.title}
              fill
              sizes="80px"
              className="object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-gray-300">
              <ImageOff className="size-6" strokeWidth={1.5} aria-hidden="true" />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-2">
            {item.product ? (
              <Link
                href={`/products/${item.product.slug}`}
                className="line-clamp-2 text-xs font-bold leading-5 text-[var(--sf-ink)]"
              >
                {item.product.title}
              </Link>
            ) : (
              <p className="line-clamp-2 text-xs font-bold leading-5 text-[var(--sf-ink)]/50">
                محصول حذف شده
              </p>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              disabled={pending}
              aria-label="حذف از سبد خرید"
              className="shrink-0 text-gray-300 active:text-red-500 disabled:opacity-50"
            >
              <Trash2 className="size-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {item.unit ? <p className="mt-0.5 text-[11px] text-[var(--sf-ink)]/45">{item.unit}</p> : null}

          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <div className="flex items-center gap-1 rounded-full border border-black/10 bg-gray-50 p-0.5">
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                disabled={pending || !item.isAvailable}
                aria-label="افزایش تعداد"
                className="flex size-7 items-center justify-center rounded-full text-[var(--sf-ink)] active:bg-white disabled:opacity-40"
              >
                <Plus className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-[var(--sf-ink)]">
                {item.quantity.toLocaleString("fa-IR")}
              </span>
              <button
                type="button"
                onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                disabled={pending || !item.isAvailable}
                aria-label="کاهش تعداد"
                className="flex size-7 items-center justify-center rounded-full text-[var(--sf-ink)] active:bg-white disabled:opacity-40"
              >
                <Minus className="size-3.5" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div className="text-left">
              <p className="whitespace-nowrap text-sm font-bold text-[var(--sf-ink)]">
                {formatNumber(item.itemTotal)}{" "}
                <span className="relative -top-0.5 text-[9px] font-medium">{TOMAN_GLYPH}</span>
              </p>
              {hasDiscount ? (
                <p className="text-[10px] text-gray-400 line-through">
                  {formatNumber(item.unitPrice * item.quantity)}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {!item.isAvailable && item.unavailableReason ? (
        <p className="border-t border-red-100 bg-red-50 px-3 py-2 text-[11px] font-medium text-red-600">
          {item.unavailableReason}
        </p>
      ) : null}
    </div>
  );
}
