import Link from "next/link";
import { ChevronLeft, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export type AccountNavRowProps = {
  href: string;
  icon: LucideIcon;
  iconClassName: string;
  title: string;
  subtitle: string;
  /** فقط وقتی مقداری واقعی وجود دارد پاس داده شود — هرگز عدد ساختگی. */
  badge?: number;
  /** برای موارد نیازمند توجه (مثلاً درخواست در حال بررسی) رنگ قرمز. */
  badgeVariant?: "neutral" | "attention";
};

/**
 * یک ردیف از کارت‌های صفحه «حساب من» (مثلاً «سفارش‌های من»،
 * «کیف پول من»). طبق رفرنس کارفرما: آیکون رنگی داخل دایره سمت
 * راست، عنوان/توضیح در وسط، Badge عددی اختیاری + فلش سمت چپ.
 *
 * `badge` عمداً Optional است و فقط وقتی از بیرون پاس داده می‌شود
 * که یک شمارش واقعی از Database موجود باشد — طبق اصل «صفر/عدد
 * واقعی، نه ساختگی» که در Bottom Bar (شمارنده سبد خرید) هم رعایت
 * شده. اگر برای یک قابلیت هنوز شمارش واقعی معنا ندارد (مثلاً چون
 * Model آن هنوز ساخته نشده)، به‌جای صفر ساختگی، Badge اصلاً پاس داده
 * نمی‌شود.
 */
export function AccountNavRow({
  href,
  icon: Icon,
  iconClassName,
  title,
  subtitle,
  badge,
  badgeVariant = "neutral",
}: AccountNavRowProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 active:bg-gray-50"
    >
      {/* اولین فرزند DOM = راست‌ترین عنصر (چون کل سایت dir="rtl" است). */}
      <span
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
          iconClassName,
        )}
      >
        <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-[var(--sf-ink)]">{title}</p>
        <p className="mt-0.5 truncate text-xs text-[var(--sf-ink)]/50">{subtitle}</p>
      </div>

      {typeof badge === "number" && (
        <span
          className={cn(
            "flex h-6 min-w-6 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold",
            badgeVariant === "attention"
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-500",
          )}
        >
          {badge > 99 ? "۹۹+" : badge.toLocaleString("fa-IR")}
        </span>
      )}

      <ChevronLeft className="size-4 shrink-0 text-gray-300" aria-hidden="true" />
    </Link>
  );
}
