import Link from "next/link";
import Image from "next/image";
import { ImageOff } from "lucide-react";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import type { OrderDetailItem } from "@/lib/storefront/get-order-detail";

/**
 * یک قلم در کارت «کالاها»ی صفحه جزئیات سفارش — نسخه بازطراحی‌شده:
 * دیگر ویژگی‌های فنی Variant (`attributes`: «شانه: ۱۲۰۰» و مثل آن)
 * نمایش داده نمی‌شوند — برای مشتری در این مرحله فقط رنگ و عکس معنی
 * دارد، نه مشخصات فنی بافت؛ آن‌ها فقط داخل Dashboard (که همچنان
 * کامل نمایش‌شان می‌دهد) لازم‌اند.
 *
 * تصویر و عنوان هر دو یک `Link` به `/products/[slug]` هستند —
 * فقط وقتی `item.product` موجود باشد (یعنی محصول هنوز `published`
 * است؛ نگاه کن `get-order-detail.ts`). اگر محصول حذف/غیرفعال شده
 * باشد، به‌جای لینک مرده (که مستقیم ۴۰۴ می‌داد)، یک جعبه خاکستری با
 * آیکون «بدون تصویر» + یک برچسب کوچک «دیگر در فروشگاه موجود نیست»
 * نشان داده می‌شود — بدون Link، چون جایی برای رفتن ندارد.
 */
export function OrderDetailItemRow({ item }: { item: OrderDetailItem }) {
  const metaLine = [item.unit, `${toPersianDigits(item.quantity)} × ${formatTomanGlyph(item.unitPrice)}`]
    .filter(Boolean)
    .join(" · ");

  const thumbnail = item.product ? (
    <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--radius-md)] bg-gray-100">
      <Image src={item.product.imageUrl} alt={item.title} fill sizes="56px" className="object-cover" />
    </div>
  ) : (
    <div className="flex size-14 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gray-100 text-gray-300">
      <ImageOff className="size-5" strokeWidth={1.5} aria-hidden="true" />
    </div>
  );

  const title = (
    <p className="truncate text-sm font-bold text-[var(--sf-ink)]">{item.title}</p>
  );

  return (
    <div className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
      {item.product ? <Link href={`/products/${item.product.slug}`}>{thumbnail}</Link> : thumbnail}

      <div className="min-w-0 flex-1">
        {item.product ? <Link href={`/products/${item.product.slug}`}>{title}</Link> : title}

        {!item.product ? (
          <p className="mt-0.5 text-[11px] font-medium text-amber-600">دیگر در فروشگاه موجود نیست</p>
        ) : null}

        {item.colorName ? (
          <div className="mt-1 flex items-center gap-1.5">
            {item.colorHex ? (
              <span
                className="size-3 shrink-0 rounded-full ring-1 ring-black/10"
                style={{ backgroundColor: item.colorHex }}
              />
            ) : null}
            <span className="text-[11px] text-[var(--sf-ink)]/50">{item.colorName}</span>
          </div>
        ) : null}

        <p className="mt-1 text-[11px] text-[var(--sf-ink)]/40">{metaLine}</p>
      </div>

      <span className="shrink-0 text-sm font-bold text-[var(--sf-ink)]">
        {formatTomanGlyph(item.lineTotal)}
      </span>
    </div>
  );
}
