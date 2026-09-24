import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import type { OrderDetailItem } from "@/lib/storefront/get-order-detail";

/**
 * یک قلم در کارت «کالاها»ی صفحه جزئیات سفارش.
 *
 * نسخه قبلی عنوان را در یک ردیف افقی، هم‌سطح با عکس و قیمت کل قرار
 * می‌داد؛ برای عنوان‌های بلند فرش این باعث می‌شد عنوان بین عکس و
 * قیمت له/Truncate شود (مشکلی که کارفرما دقیقاً همین را دید). حالا:
 * - عنوان زیر عکس نیست، کنار آن است ولی دیگر با قیمت هم‌ردیف/رقیب
 *   فضا نیست — کل عرض ستون کنار عکس مال خودش است و کامل Wrap
 *   می‌شود (بدون Truncate).
 * - رنگ (Variant) دقیقاً زیر عنوان.
 * - تعداد×قیمت واحد و قیمت کل هر دو در یک ردیف پایینی‌اند: تعداد×واحد
 *   سمت راست (شروع)، قیمت کل سمت چپ (پایان) — دقیقاً طبق خواسته.
 *
 * ویژگی‌های فنی Variant همچنان نمایش داده نمی‌شوند (فقط Dashboard).
 * منطق Link/Fallback محصول حذف‌شده هم بدون تغییر باقی مانده.
 */
export function OrderDetailItemRow({ item }: { item: OrderDetailItem }) {
  const thumbnail = item.product ? (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-gray-100">
      <Image src={item.product.imageUrl} alt={item.title} fill sizes="56px" className="object-cover" />
    </div>
  ) : (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gray-100 text-gray-300">
      <ImageOff className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );

  const title = <p className="text-sm font-bold leading-5 text-[var(--sf-ink)]">{item.title}</p>;

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex items-start gap-3">
        {item.product ? <Link href={`/products/${item.product.slug}`}>{thumbnail}</Link> : thumbnail}

        <div className="min-w-0 flex-1 pt-0.5">
          {item.product ? <Link href={`/products/${item.product.slug}`}>{title}</Link> : title}

          {!item.product ? (
            <p className="mt-1 text-[11px] font-medium text-amber-600">دیگر در فروشگاه موجود نیست</p>
          ) : null}

          {item.colorName ? (
            <div className="mt-1.5 flex items-center gap-1.5">
              {item.colorHex ? (
                <span
                  className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                  style={{ backgroundColor: item.colorHex }}
                />
              ) : null}
              <span className="text-[11px] text-[var(--sf-ink)]/50">{item.colorName}</span>
            </div>
          ) : null}

          <div className="mt-2 flex items-center justify-between gap-2">
            <span className="text-[11px] text-[var(--sf-ink)]/40">
              {item.unit ? `${item.unit} · ` : ""}
              {toPersianDigits(item.quantity)} × {formatTomanGlyph(item.unitPrice)}
            </span>
            <span className="shrink-0 text-sm font-bold text-[var(--sf-ink)]">
              {formatTomanGlyph(item.lineTotal)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
