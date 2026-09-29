"use client";

import Link from "next/link";
import { Bell, Gift, Megaphone, Package, Percent, Timer, Users } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatRelativeTime } from "@/lib/notifications/relative-time";
import type { NotificationDTO, NotificationType } from "@/lib/notifications/constants";

const TYPE_STYLE: Record<NotificationType, { icon: typeof Bell; bg: string; color: string }> = {
  announcement: { icon: Megaphone, bg: "bg-sky-50", color: "text-sky-600" },
  promotion: { icon: Percent, bg: "bg-amber-50", color: "text-amber-600" },
  coupon: { icon: Gift, bg: "bg-emerald-50", color: "text-emerald-600" },
  special_offer: { icon: Percent, bg: "bg-rose-50", color: "text-rose-600" },
  order: { icon: Package, bg: "bg-indigo-50", color: "text-indigo-600" },
  referral: { icon: Users, bg: "bg-violet-50", color: "text-violet-600" },
  coupon_expiry: { icon: Timer, bg: "bg-orange-50", color: "text-orange-600" },
  system: { icon: Bell, bg: "bg-gray-100", color: "text-gray-600" },
};

/** مقصد کلیک: لینک اعلان اگر داشت، وگرنه صفحه جزئیات (برای متن کامل). */
export function notificationHref(item: Pick<NotificationDTO, "id" | "link">): string {
  return item.link ?? `/notifications/${item.id}`;
}

export function NotificationItem({
  item,
  canMarkRead,
  onRead,
  className,
}: {
  item: NotificationDTO;
  /** فقط کاربر واردشده Read State دارد. */
  canMarkRead: boolean;
  onRead?: (id: string) => void;
  className?: string;
}) {
  const style = TYPE_STYLE[item.type] ?? TYPE_STYLE.system;
  const Icon = style.icon;
  const unread = !item.isRead;

  function handleClick() {
    if (!canMarkRead || item.isRead) return;
    onRead?.(item.id);
    // Fire-and-forget؛ ناوبری نباید منتظر آن بماند.
    void fetch(`/api/v1/notifications/${item.id}/read`, { method: "PATCH", keepalive: true }).catch(
      () => undefined,
    );
  }

  return (
    <Link
      href={notificationHref(item)}
      onClick={handleClick}
      className={cn(
        "flex gap-3 px-4 py-3 active:bg-gray-50",
        unread && "bg-[var(--color-primary-soft)]/40",
        className,
      )}
    >
      <span
        className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", style.bg, style.color)}
      >
        <Icon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm text-[var(--sf-ink)]", unread ? "font-semibold" : "font-medium")}>
            {item.title}
          </p>
          {unread ? (
            <>
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]"
              />
              <span className="sr-only">خوانده نشده</span>
            </>
          ) : null}
        </div>
        {item.excerpt ? (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{item.excerpt}</p>
        ) : null}
        <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(item.publishAt)}</p>
      </div>
    </Link>
  );
}
