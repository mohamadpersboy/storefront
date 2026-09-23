import { CheckCircle2, XCircle, PackageSearch, Truck, RotateCcw } from "lucide-react";
import type { OrderStatus } from "@/lib/constants/order-status";
import { orderStatusLabels } from "@/components/orders/order-status-badge";

const BANNER_STYLES: Record<OrderStatus, { className: string; icon: typeof CheckCircle2 }> = {
  pending: { className: "bg-amber-50 text-amber-700", icon: PackageSearch },
  confirmed: { className: "bg-blue-50 text-blue-700", icon: PackageSearch },
  processing: { className: "bg-blue-50 text-blue-700", icon: PackageSearch },
  ready_to_ship: { className: "bg-blue-50 text-blue-700", icon: PackageSearch },
  shipped: { className: "bg-blue-50 text-blue-700", icon: Truck },
  delivered: { className: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
  cancelled: { className: "bg-rose-50 text-rose-700", icon: XCircle },
  returned: { className: "bg-rose-50 text-rose-700", icon: RotateCcw },
};

/**
 * توضیح پیش‌فرض هر وضعیت — فقط وقتی استفاده می‌شود که آخرین
 * ردیفِ `statusHistory` یادداشت خالی داشته باشد (اکثر تغییرات
 * وضعیت، چون ادمین معمولاً یادداشتی نمی‌نویسد مگر برای توضیح یک
 * استثنا مثل لغو). این‌طور بنر هیچ‌وقت خالی نمی‌ماند.
 */
const DEFAULT_DESCRIPTIONS: Record<OrderStatus, string> = {
  pending: "سفارش شما ثبت شد و در انتظار تأیید است.",
  confirmed: "سفارش شما تأیید شد و به‌زودی آماده‌سازی می‌شود.",
  processing: "سفارش شما در حال آماده‌سازی است.",
  ready_to_ship: "سفارش شما آماده ارسال است.",
  shipped: "سفارش شما ارسال شد و در راه است.",
  delivered: "سفارش شما با موفقیت تحویل داده شد.",
  cancelled: "این سفارش لغو شده است.",
  returned: "این سفارش مرجوع شده است.",
};

/**
 * بنر وضعیت بالای صفحه جزئیات سفارش — رفرنس کارفرما (رفوند کیف
 * پول/کد پیگیری بانک) عیناً پیاده نشد چون این پروژه اصلاً چنین
 * فیلدهایی را ذخیره نمی‌کند (`Order` مدل هیچ فیلد Refund ندارد؛
 * لغو سفارش فقط موجودی را برمی‌گرداند، نگاه کنید
 * `api/v1/orders/[id]/status/route.ts`) — به‌جایش، اگر ادمین هنگام
 * تغییر وضعیت یادداشتی نوشته باشد (مثلاً توضیح لغو یا شماره
 * پیگیری پستی که دستی وارد کرده)، همان یادداشت این‌جا نمایش داده
 * می‌شود؛ در غیر این صورت یک توضیح پیش‌فرض مناسب همان وضعیت.
 */
export function OrderStatusBanner({
  status,
  note,
}: {
  status: OrderStatus;
  note: string;
}) {
  const { className, icon: Icon } = BANNER_STYLES[status];

  return (
    <div className={`flex items-start gap-3 rounded-[var(--radius-lg)] p-4 ${className}`}>
      <Icon className="size-6 shrink-0" strokeWidth={1.75} aria-hidden="true" />
      <div>
        <p className="text-sm font-bold">{orderStatusLabels[status] ?? "نامشخص"}</p>
        <p className="mt-0.5 text-xs opacity-80">{note || DEFAULT_DESCRIPTIONS[status]}</p>
      </div>
    </div>
  );
}
