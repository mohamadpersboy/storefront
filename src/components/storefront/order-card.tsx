import Link from "next/link";
import { Package, Calendar } from "lucide-react";
import { formatTomanGlyph, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import { StorefrontOrderStatusBadge } from "@/components/storefront/order-status-badge";
import type { OrderListItem } from "@/lib/storefront/get-user-orders";

/**
 * یک ردیف سفارش در `/orders` — عمداً کپی کارت رفرنس فروشگاه میوه
 * نیست (نه پس‌زمینه سبز/قرمز گرادیانی، نه دکمه لغو داخل خودِ لیست):
 * ساختار هم‌خانواده با کارت‌های دیگر پروژه (`FavoriteProductCard`،
 * `CartItemRow`) — کارت سفید ساده + Border ملایم، آیکون در دایره
 * رنگی سمت راست هم‌الگو با `AccountNavRow`/`WalletTransactionRow`
 * (زبان بصری یکدست در کل «حساب من»)، بدون شلوغی/گرادیان.
 *
 * کل کارت یک Link به `/orders/[id]` است — آن صفحه هنوز ساخته نشده؛
 * دقیقاً هم‌الگو با تصمیم مستندشده در `/account/page.tsx` برای
 * لینک‌های مقصدِ ماژول بعدی (لینک درست ساخته می‌شود، مقصد در تأیید
 * بعدی اضافه می‌شود).
 */
export function OrderCard({ order }: { order: OrderListItem }) {
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-3.5 active:bg-gray-50"
    >
      <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
        <Package className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-[var(--sf-ink)]">
            سفارش #{toPersianDigits(order.orderNumber)}
          </p>
          <StorefrontOrderStatusBadge status={order.status} />
        </div>

        <p className="mt-0.5 truncate text-xs text-[var(--sf-ink)]/50">{order.itemsSummary}</p>

        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[11px] text-[var(--sf-ink)]/40">
            <Calendar className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            {formatJalali(order.createdAt)}
          </span>
          <span className="text-sm font-bold text-[var(--sf-ink)]">
            {formatTomanGlyph(order.totalAmount)}
          </span>
        </div>
      </div>
    </Link>
  );
}
