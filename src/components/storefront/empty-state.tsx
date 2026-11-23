import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { EmptyIllustration, type EmptyIllustrationKind } from "@/components/storefront/empty-illustration";

type EmptyStateProps = {
  /** تصویر مینیاتوری اختصاصی (سبد، علاقه‌مندی‌ها، سفارش‌ها، اعلان‌ها). اگر داده شود به‌جای آیکون نمایش داده می‌شود. */
  illustration?: EmptyIllustrationKind;
  /** آیکون ساده برای صفحه‌هایی که تصویر اختصاصی ندارند. */
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel: string;
  actionHref: string;
};

/**
 * حالت خالی مشترک صفحات لیستی Storefront (سبد خرید، علاقه‌مندی‌ها،
 * سفارش‌ها، کدهای تخفیف — و هر لیست خالی بعدی). قبلاً هرکدام نسخه
 * جدا و کوچکی داشتند: آیکون کوچک خاکستری، بدون وسط‌چین واقعی روی
 * صفحه (فقط `py-*`، که روی صفحه‌های بلند نتیجه‌اش نزدیک بالا بود، نه
 * وسط) — دقیقاً همان چیزی که کارفرما گفت بی‌روح است.
 *
 * الان همان ترکیب بصری‌ای که قبلاً برای `not-found.tsx` طراحی و
 * تأیید شده بود این‌جا هم به‌کار رفت (دایره گرادیانی بزرگ‌تر + Ring +
 * آیکون درشت‌تر) تا یک زبان بصری یکسان برای هر «این‌جا چیزی نیست»ی
 * در کل Storefront باشد، به‌جای بازطراحی هرکدام جداگانه. تفاوت با
 * `not-found.tsx`: این صفحات یک `PageHeader` بالای خودشان دارند
 * (آن صفحه ندارد)، پس `min-h` کمی کمتر است (`60vh` به‌جای `70vh`)
 * تا مجموعِ Header + این بلوک از ارتفاع یک صفحه موبایل معمولی
 * بیرون نزند و واقعاً وسط دیده شود، نه پایین‌تر از وسط.
 *
 * Component بدون Hook است (فقط JSX ساده)، پس هم داخل صفحات Server
 * (`/orders`، `/favorites`، `/account/coupons`) و هم داخل
 * `cart-page-client.tsx` (Client Component) بدون مشکل قابل استفاده
 * است.
 */
export function EmptyState({ illustration, icon: Icon, title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {illustration ? (
        <EmptyIllustration kind={illustration} className="w-[230px] max-w-full" />
      ) : Icon ? (
        <span className="flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary-soft)] to-white text-[var(--color-primary)] ring-1 ring-black/5">
          <Icon className="size-9" strokeWidth={1.5} aria-hidden="true" />
        </span>
      ) : null}
      <div className="space-y-1.5">
        <p className="text-sm font-bold text-[var(--sf-ink)]">{title}</p>
        {description ? (
          <p className="max-w-[260px] text-xs leading-6 text-[var(--sf-ink)]/50">{description}</p>
        ) : null}
      </div>
      <Link
        href={actionHref}
        className="mt-1 rounded-full bg-[var(--color-primary)] px-6 py-2.5 text-xs font-bold text-white active:bg-[var(--color-primary-hover)]"
      >
        {actionLabel}
      </Link>
    </div>
  );
}
