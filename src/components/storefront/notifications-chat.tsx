"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, BellOff, Loader2 } from "lucide-react";
import { getActiveScroller } from "@/lib/storefront/scroll-container";
import { chatDayKey, formatChatDayLabel } from "@/lib/notifications/chat-format";
import { PAGE_SIZE, type NotificationDetailDTO } from "@/lib/notifications/constants";
import { toPersianDigits } from "@/lib/utils/format";
import { NotificationBubble } from "@/components/storefront/notification-bubble";

/** مدت نمایش «دیده‌نشده» قبل از ثبت خوانده‌شدن (تا کاربر وضعیت را ببیند). */
const MARK_READ_DELAY_MS = 1500;

function scrollHeightNow(): number {
  const scroller = getActiveScroller();
  return scroller ? scroller.scrollHeight : document.documentElement.scrollHeight;
}

function mergeOlder(
  current: NotificationDetailDTO[],
  olderNewestFirst: NotificationDetailDTO[],
): NotificationDetailDTO[] {
  const known = new Set(current.map((i) => i.id));
  const fresh = olderNewestFirst.filter((i) => !known.has(i.id)).reverse();
  return [...fresh, ...current];
}

/**
 * صفحهٔ اعلان‌ها به شکل چت پیام‌رسان: قدیمی‌ترین بالا، جدیدترین پایین،
 * جداکنندهٔ روز، ساعت هر پیام و تیک دیده‌شدن. با باز شدن صفحه به اولین
 * پیام خوانده‌نشده (وگرنه انتهای چت) اسکرول می‌شود و بعد از مکثی کوتاه
 * همه «خوانده» ثبت می‌شوند (`read-all`).
 */
export function NotificationsChat({
  initialItems,
  initialHasMore,
  canMarkRead,
  now,
}: {
  /** جدیدترین اول (همان ترتیب API)؛ اینجا برعکس می‌شود. */
  initialItems: NotificationDetailDTO[];
  initialHasMore: boolean;
  canMarkRead: boolean;
  /** زمان سرور (ms)؛ برای یکسان بودن رندر سرور و Client. */
  now: number;
}) {
  const router = useRouter();
  const [items, setItems] = useState(() => [...initialItems].reverse());
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // اولین پیام خوانده‌نشده در لحظهٔ ورود؛ جداکننده تا پایان بازدید می‌ماند.
  const [firstUnreadId] = useState(() =>
    canMarkRead ? ([...initialItems].reverse().find((i) => !i.isRead)?.id ?? null) : null,
  );
  const unreadAtEntry = useState(() => (canMarkRead ? initialItems.filter((i) => !i.isRead).length : 0))[0];

  const dividerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ prevHeight: number } | null>(null);

  const hasUnread = items.some((i) => !i.isRead);

  // اسکرول اولیه: بعد از بازیابی اسکرولِ `useFrameScroll` (دو فریم).
  useEffect(() => {
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        if (dividerRef.current) dividerRef.current.scrollIntoView({ block: "start" });
        else bottomRef.current?.scrollIntoView({ block: "end" });
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, []);

  // «خوانده شد» برای کاربر واردشده.
  useEffect(() => {
    if (!canMarkRead || !hasUnread) return;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/v1/notifications/read-all", { method: "PATCH" });
        if (res.ok) setItems((list) => list.map((i) => (i.isRead ? i : { ...i, isRead: true })));
      } catch {
        /* شکست شبکه: در بازدید بعدی دوباره تلاش می‌شود. */
      }
    }, MARK_READ_DELAY_MS);
    return () => clearTimeout(timer);
  }, [canMarkRead, hasUnread]);

  // بعد از اضافه شدن پیام‌های قدیمی‌تر، موقعیت دیدِ کاربر ثابت بماند.
  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    anchorRef.current = null;
    const delta = scrollHeightNow() - anchor.prevHeight;
    if (delta <= 0) return;
    const scroller = getActiveScroller();
    if (scroller) scroller.scrollTop += delta;
    else window.scrollBy(0, delta);
  }, [items]);

  async function loadOlder() {
    if (loadingMore) return;
    setLoadingMore(true);
    setLoadError(false);
    try {
      const res = await fetch(
        `/api/v1/notifications?view=chat&page=${page + 1}&limit=${PAGE_SIZE}`,
        { cache: "no-store" },
      );
      const body = await res.json();
      if (!res.ok || !body?.success) throw new Error();
      anchorRef.current = { prevHeight: scrollHeightNow() };
      setItems((list) => mergeOlder(list, body.data as NotificationDetailDTO[]));
      setPage((p) => p + 1);
      setHasMore(Boolean(body.pagination?.hasNextPage));
    } catch {
      setLoadError(true);
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="relative min-h-dvh">
      {/* پس‌زمینهٔ چت؛ روی دسکتاپ `fixed` نسبت به قاب موبایل است. */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-[#e9dfa8]">
        <Image
          src="/images/notifications-chat-bg.webp"
          alt=""
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 448px"
          className="object-cover"
        />
      </div>

      <div className="relative z-10">
        <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+12px)] backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="بازگشت"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
            >
              <ArrowRight className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
            </button>
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={40}
              height={40}
              className="size-10 shrink-0 rounded-full ring-1 ring-black/5"
            />
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-[var(--sf-ink)]">فرش سقطچی</h1>
              <p className="truncate text-xs text-[var(--sf-ink)]/50">اعلان‌های فروشگاه</p>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-2 px-3 pb-6 pt-3">
          {hasMore ? (
            <div className="flex flex-col items-center gap-1 pb-1">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingMore}
                className="flex min-h-9 items-center gap-1.5 rounded-full bg-black/25 px-4 text-xs font-medium text-white backdrop-blur disabled:opacity-70 active:bg-black/35"
              >
                {loadingMore ? (
                  <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                ) : null}
                پیام‌های قدیمی‌تر
              </button>
              {loadError ? (
                <p className="rounded-full bg-white/90 px-3 py-1 text-[11px] text-rose-600">
                  دریافت پیام‌های قدیمی‌تر ناموفق بود؛ دوباره تلاش کنید.
                </p>
              ) : null}
            </div>
          ) : null}

          {items.length === 0 ? (
            <div className="mx-auto mt-16 flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-[0_1px_2px_rgba(3,23,37,0.18)]">
              <span className="flex size-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <BellOff className="size-7" strokeWidth={1.5} aria-hidden="true" />
              </span>
              <p className="text-sm font-bold text-[var(--sf-ink)]">اعلان جدیدی ندارید.</p>
              <Link
                href="/"
                className="rounded-full bg-[var(--color-primary)] px-5 py-2 text-xs font-bold text-white active:bg-[var(--color-primary-hover)]"
              >
                بازگشت به فروشگاه
              </Link>
            </div>
          ) : null}

          {items.map((item, index) => {
            const showDay =
              index === 0 || chatDayKey(items[index - 1].publishAt) !== chatDayKey(item.publishAt);
            const isDivider = item.id === firstUnreadId;
            return (
              <div key={item.id} className="flex flex-col gap-2">
                {showDay ? (
                  <p className="mx-auto mt-1 w-fit rounded-full bg-black/25 px-3 py-1 text-xs font-medium text-white backdrop-blur">
                    {formatChatDayLabel(item.publishAt, new Date(now))}
                  </p>
                ) : null}
                {isDivider ? (
                  <div
                    ref={dividerRef}
                    className="-mx-3 scroll-mt-20 bg-black/25 py-1 text-center text-xs font-medium text-white backdrop-blur"
                  >
                    {unreadAtEntry > 1
                      ? `${toPersianDigits(unreadAtEntry)} پیام خوانده‌نشده`
                      : "پیام خوانده‌نشده"}
                  </div>
                ) : null}
                <NotificationBubble item={item} showReadState={canMarkRead} now={now} />
              </div>
            );
          })}

          <div ref={bottomRef} className="scroll-mb-24" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}
