import Link from "next/link";
import type { OrderListStatusFilter } from "@/lib/storefront/get-user-orders";
import { cn } from "@/lib/utils/cn";

const TABS: { value: OrderListStatusFilter; label: string }[] = [
  { value: "all", label: "همه" },
  { value: "in_progress", label: "در حال انجام" },
  { value: "delivered", label: "تحویل‌شده" },
  { value: "cancelled", label: "لغوشده" },
];

/**
 * تب‌های فیلتر وضعیت سفارش‌ها — عمداً یک Link ساده به `?status=...`
 * است، نه یک Client Component با State: تغییر تب یک ناوبری واقعی
 * (Query Param جدید، صفحه‌بندی هم به ۱ برمی‌گردد چون `page` در URL
 * جدید نیست)، پس نیازی به JavaScript سمت کاربر نیست — دقیقاً هم‌الگو
 * با تصمیم مشابه در صفحه‌بندی `/favorites`.
 *
 * ترتیب رفرنس (همه/لغوشده/تحویل‌شده/در حال انجام، راست‌به‌چپ) عمداً
 * رعایت نشد — این‌جا منطقی‌تر است «همه» اول باشد و بعد مسیر واقعی
 * یک سفارش (در حال انجام → تحویل‌شده → لغوشده).
 */
export function OrderStatusTabs({ active }: { active: OrderListStatusFilter }) {
  return (
    <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          href={tab.value === "all" ? "/orders" : `/orders?status=${tab.value}`}
          className={cn(
            "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold",
            tab.value === active
              ? "bg-[var(--color-primary)] text-white"
              : "bg-gray-100 text-[var(--sf-ink)]/60",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );
}
