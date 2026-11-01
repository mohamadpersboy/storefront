import Image from "next/image";
import {
  Bell,
  Check,
  CheckCheck,
  Gift,
  Megaphone,
  Package,
  Percent,
  Timer,
  Users,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatChatClock, notificationLinkLabel } from "@/lib/notifications/chat-format";
import { stripCouponLines } from "@/lib/notifications/templates";
import type { NotificationDetailDTO, NotificationType } from "@/lib/notifications/constants";
import { CopyCodeButton, NotificationLinkButton } from "@/components/storefront/notification-actions";
import { CouponDetailsCard, OrderSummaryCard } from "@/components/storefront/notification-cards";

const TYPE_LABEL: Record<NotificationType, { label: string; icon: LucideIcon; color: string }> = {
  announcement: { label: "اطلاعیه", icon: Megaphone, color: "text-sky-600" },
  promotion: { label: "تخفیف و کمپین", icon: Percent, color: "text-amber-600" },
  coupon: { label: "کد تخفیف", icon: Gift, color: "text-emerald-600" },
  special_offer: { label: "پیشنهاد ویژه", icon: Percent, color: "text-rose-600" },
  order: { label: "سفارش", icon: Package, color: "text-indigo-600" },
  referral: { label: "دعوت دوستان", icon: Users, color: "text-violet-600" },
  coupon_expiry: { label: "یادآوری کد تخفیف", icon: Timer, color: "text-orange-600" },
  system: { label: "سیستم", icon: Bell, color: "text-gray-600" },
};

/**
 * یک پیام اعلان به شکل حباب چت. وضعیت دیده‌شدن (تیک تکی/دوتایی) فقط
 * برای کاربر واردشده نشان داده می‌شود؛ Guest وضعیت خوانده‌شدن ندارد.
 */
export function NotificationBubble({
  item,
  showReadState,
  now,
}: {
  item: NotificationDetailDTO;
  showReadState: boolean;
  now: number;
}) {
  const type = TYPE_LABEL[item.type] ?? TYPE_LABEL.system;
  const TypeIcon = type.icon;
  const meta = item.meta;

  const text = meta?.kind === "coupon" ? stripCouponLines(item.content) : item.content;
  const couponExpired = meta?.kind === "coupon" && new Date(meta.expiresAt).getTime() <= now;

  return (
    <article
      className="max-w-[94%] self-start overflow-hidden rounded-2xl rounded-ss-md bg-white shadow-[0_1px_2px_rgba(3,23,37,0.18)]"
      aria-label={item.title}
    >
      {item.imageUrl ? (
        <Image
          src={item.imageUrl}
          alt=""
          width={800}
          height={450}
          sizes="(max-width: 1024px) 94vw, 420px"
          className="h-auto w-full"
        />
      ) : null}

      <div className="space-y-2.5 px-3.5 pb-2 pt-2.5">
        <p className={cn("flex items-center gap-1 text-[11px] font-bold", type.color)}>
          <TypeIcon className="size-3.5" strokeWidth={2} aria-hidden="true" />
          {type.label}
        </p>

        <h2 className="text-sm font-bold leading-6 text-[var(--sf-ink)]">{item.title}</h2>

        {item.contentFormat === "html" && text ? (
          <div
            className="notification-content text-[13px] leading-6 text-[var(--sf-ink)]"
            dangerouslySetInnerHTML={{ __html: text }}
          />
        ) : text ? (
          <p className="whitespace-pre-line text-[13px] leading-6 text-[var(--sf-ink)]/80">{text}</p>
        ) : null}

        {meta?.kind === "order" ? <OrderSummaryCard meta={meta} /> : null}
        {meta?.kind === "coupon" ? (
          <CouponDetailsCard meta={meta} audience={item.audience} now={now} />
        ) : null}

        {meta?.kind === "coupon" ? (
          <CopyCodeButton code={meta.code} disabled={couponExpired} />
        ) : item.link ? (
          <NotificationLinkButton href={item.link}>
            {notificationLinkLabel(item.type)}
          </NotificationLinkButton>
        ) : null}

        <p className="flex items-center justify-end gap-1 text-[11px] text-gray-400">
          <span>{formatChatClock(item.publishAt)}</span>
          {showReadState ? (
            item.isRead ? (
              <>
                <CheckCheck className="size-4 text-[var(--sf-accent)]" strokeWidth={2} aria-hidden="true" />
                <span className="sr-only">دیده شده</span>
              </>
            ) : (
              <>
                <Check className="size-4 text-gray-400" strokeWidth={2} aria-hidden="true" />
                <span className="sr-only">دیده نشده</span>
              </>
            )
          ) : null}
        </p>
      </div>
    </article>
  );
}
