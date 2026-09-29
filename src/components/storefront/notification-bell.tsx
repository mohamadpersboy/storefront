"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { NotificationItem } from "@/components/storefront/notification-item";
import { POPUP_LIMIT, type NotificationDTO } from "@/lib/notifications/constants";

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
  const [items, setItems] = useState<NotificationDTO[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loggedIn, setLoggedIn] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [reloadToken, setReloadToken] = useState(0);

  // شمارنده unread (و اینکه کاربر واردشده است) — یک‌بار هنگام Mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/v1/notifications/unread-count", { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (cancelled || !body?.success) return;
        setUnreadCount(body.data.count);
        setLoggedIn(body.data.authenticated);
      })
      .catch(() => undefined); // شمارنده اختیاری است؛ خطا UI را خراب نمی‌کند.
    return () => {
      cancelled = true;
    };
  }, []);

  // لیست پاپ‌آپ — هر بار باز شدن (و «تلاش دوباره»).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/v1/notifications?limit=${POPUP_LIMIT}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((body) => {
        if (cancelled) return;
        if (!body?.success) throw new Error();
        setFailed(false);
        setItems(body.data);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [open, reloadToken]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function markAllAsRead() {
    setItems((list) => list?.map((item) => ({ ...item, isRead: true })) ?? list);
    setUnreadCount(0);
    try {
      await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
    } catch {
      /* شکست شبکه: شمارنده در بازدید بعدی از سرور درست می‌شود. */
    }
  }

  function handleItemRead(id: string) {
    setItems((list) => list?.map((i) => (i.id === id ? { ...i, isRead: true } : i)) ?? list);
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  const hasUnread = unreadCount > 0;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={hasUnread ? `اعلان‌ها، ${unreadCount} خوانده‌نشده` : "اعلان‌ها"}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-400 active:bg-gray-200"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        {hasUnread ? (
          <span className="absolute -end-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[var(--color-primary)] px-1 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "۹+" : new Intl.NumberFormat("fa-IR").format(unreadCount)}
          </span>
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="اعلان‌ها"
          className="fixed left-4 z-50 w-[min(340px,calc(100vw-32px))] overflow-visible rounded-2xl border border-black/5 bg-white shadow-[0_16px_40px_rgba(3,23,37,0.18)]"
          style={{ top: "calc(env(safe-area-inset-top) + 68px)" }}
        >
          <span
            aria-hidden="true"
            className="absolute -top-2 h-0 w-0 border-x-8 border-b-8 border-x-transparent border-b-white"
            style={{ left: 66 }}
          />

          <div className="overflow-hidden rounded-2xl">
            <div className="flex items-center justify-between border-b border-black/5 px-4 py-3">
              <p className="text-sm font-semibold text-[var(--sf-ink)]">اعلان‌ها</p>
              {hasUnread && loggedIn ? (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs font-medium text-[var(--color-primary)]"
                >
                  علامت‌گذاری همه
                </button>
              ) : null}
            </div>

            {items === null && !failed ? (
              <div className="flex flex-col gap-3 p-4" aria-busy="true">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-gray-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : failed ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">دریافت اعلان‌ها ناموفق بود</p>
                <button
                  type="button"
                  onClick={() => setReloadToken((t) => t + 1)}
                  className="mt-2 text-sm font-medium text-[var(--color-primary)]"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : items && items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <Bell className="h-8 w-8 text-gray-300" strokeWidth={1.5} aria-hidden="true" />
                <p className="text-sm text-gray-400">اعلان جدیدی ندارید.</p>
              </div>
            ) : (
              <ul className="max-h-[60vh] divide-y divide-black/5 overflow-y-auto">
                {items?.map((item) => (
                  <li key={item.id}>
                    <NotificationItem item={item} canMarkRead={loggedIn} onRead={handleItemRead} />
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
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
