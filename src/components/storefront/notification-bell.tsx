"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Ticket, Truck, Heart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

type MockNotification = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: typeof Bell;
  iconBg: string;
  iconColor: string;
};

/**
 * داده Mock — طبق درخواست صریح کارفرما («چون فعلا داده‌ای نداریم از
 * mock استفاده کن») و طبق بند ۱۳ Master Workflow (Mock فقط جایی که
 * API واقعی هنوز آماده نیست، با نام فیلد هماهنگ با ساختار واقعی
 * Backend). ساختار فیلدها (title/description/time/read) با آنچه
 * از یک Notification واقعی انتظار می‌رود هماهنگ است تا بعداً فقط
 * منبع داده عوض شود، نه شکل داده.
 *
 * محتوا مختص مشتری Storefront است (نه اعلان‌های ادمین مثل «سفارش
 * جدید ثبت شد» که در رفرنس کارفرما بود ولی برای Dashboard مناسب‌تر
 * است، نه برای کاربر نهایی فروشگاه).
 */
const MOCK_NOTIFICATIONS: MockNotification[] = [
  {
    id: "1",
    title: "سفارش شما ارسال شد",
    description: "سفارش #۱۴۲۲ به مبلغ ۴,۸۵۰,۰۰۰ تومان تحویل پست شد",
    time: "۱۴۰۵/۰۵/۱۸ - ۱۰:۳۰",
    read: false,
    icon: Truck,
    iconBg: "bg-blue-50",
    iconColor: "text-blue-600",
  },
  {
    id: "2",
    title: "کد تخفیف ویژه برای شما",
    description: "کد SAGHCHI20 با ۲۰٪ تخفیف تا پایان هفته فعال است",
    time: "۱۴۰۵/۰۵/۱۷ - ۱۸:۰۰",
    read: false,
    icon: Ticket,
    iconBg: "bg-purple-50",
    iconColor: "text-purple-600",
  },
  {
    id: "3",
    title: "محصول موردعلاقه شما تخفیف خورد",
    description: "فرش ۱۲ متری طرح باستان ۱۵٪ تخفیف خورد",
    time: "۱۴۰۵/۰۵/۱۶ - ۰۹:۱۵",
    read: true,
    icon: Heart,
    iconBg: "bg-rose-50",
    iconColor: "text-rose-600",
  },
  {
    id: "4",
    title: "پرداخت با موفقیت انجام شد",
    description: "پرداخت سفارش #۱۳۹۸ تأیید و ثبت شد",
    time: "۱۴۰۵/۰۵/۱۴ - ۱۲:۴۰",
    read: true,
    icon: CheckCircle2,
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
  },
];

/**
 * دکمه اعلان‌ها + پاپ‌آپ.
 *
 * بستن با کلیک بیرون: با `pointerdown` روی `document` (نه فقط
 * `mousedown`) تا روی موبایل/تاچ هم درست کار کند. بستن با کلید
 * Escape هم برای Accessibility اضافه شده.
 *
 * موقعیت‌دهی: پاپ‌آپ به‌جای Absolute نسبت به دکمه کوچک Bell (که
 * باعث می‌شد خیلی به لبه چپ نزدیک نباشد)، `fixed` نسبت به کل صفحه
 * است و با `left-4` دقیقاً هم‌راستا با Padding افقی بقیه صفحه
 * (۱۶px) به حاشیه سمت چپ چسبانده شده — طبق درخواست صریح کارفرما.
 * فاصله بالای پاپ‌آپ با Top Bar عمداً صفر است (`top: safe-area +
 * 68px`، دقیقاً ارتفاع خود Top Bar) تا مماس با لبه پایین آن باشد —
 * طبق بازخورد «فاصله خیلی زیاده، مماس بردر بشه». یک فلش/مثلث کوچک
 * CSS با `left:66px` دقیقاً زیر دکمه Bell (نه Search یا Support)
 * قرار گرفته تا مشخص باشد این پاپ‌آپ مال کدام دکمه است؛ این عدد از
 * محاسبه موقعیت واقعی دکمه Bell داخل گروه آیکون‌ها به‌دست آمده
 * (نه حدسی): گروه آیکون‌ها از `px-4` (۱۶px) شروع می‌شود و چون در
 * RTL ترتیب بصری برعکس DOM است، دکمه Bell (دومین در DOM) در وسط
 * گروه سه‌تایی قرار می‌گیرد — مرکز آن ≈۹۰px از لبه چپ صفحه، یعنی
 * ≈۷۴px نسبت به لبه چپ پاپ‌آپ (که خودش در `left-4`=۱۶px است).
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasUnread = notifications.some((item) => !item.read);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function markAllAsRead() {
    setNotifications((items) => items.map((item) => ({ ...item, read: true })));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="اعلان‌ها"
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        {hasUnread && (
          <span className="absolute end-2.5 top-2.5 h-2 w-2 rounded-full bg-[var(--color-primary)] ring-2 ring-white" />
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="اعلان‌ها"
          className="fixed left-4 z-50 w-[min(340px,calc(100vw-32px))] overflow-visible rounded-2xl border border-black/5 bg-white shadow-[0_16px_40px_rgba(3,23,37,0.18)]"
          style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}
        >
          {/* فلش کوچک — دقیقاً زیر دکمه Bell (نه Search/Support)،
              مماس با لبه پایین Top Bar، تا مشخص باشد این پاپ‌آپ
              مال کدام دکمه است. */}
          <span
            aria-hidden="true"
            className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white"
            style={{ left: 66 }}
          />

          <div className="overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--sf-ink)]">
                اعلان‌ها
              </p>
              {hasUnread && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-[var(--color-primary)]"
                >
                  علامت‌گذاری همه
                </button>
              )}
            </div>

            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell
                  className="h-8 w-8 text-gray-300"
                  strokeWidth={1.5}
                  aria-hidden="true"
                />
                <p className="text-sm text-gray-400">
                  اعلانی برای نمایش وجود ندارد
                </p>
              </div>
            ) : (
              <ul className="max-h-[60vh] overflow-y-auto">
                {notifications.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li
                      key={item.id}
                      className={cn(
                        "flex gap-3 border-b border-black/5 px-4 py-3 last:border-b-0",
                        !item.read && "bg-[var(--color-primary-soft)]/40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          item.iconBg,
                          item.iconColor,
                        )}
                      >
                        <Icon className="h-4.5 w-4.5" strokeWidth={2} aria-hidden="true" />
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-[var(--sf-ink)]">
                            {item.title}
                          </p>
                          {!item.read && (
                            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-primary)]" />
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {item.description}
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">{item.time}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            <Link
              href="/notifications"
              className="block border-t border-black/5 px-4 py-3 text-center text-sm font-medium text-[var(--color-primary)]"
            >
              مشاهده همه اعلان‌ها
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
