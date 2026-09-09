"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";

/**
 * دکمه اعلان‌ها + پاپ‌آپ.
 *
 * `hasUnread` فعلاً همیشه `false` است — دقیقاً هم‌الگو با بج سبد
 * خرید در Bottom Bar: تا API واقعی اعلان‌ها در Backend وصل نشود،
 * State واقعی "بدون اعلان" نمایش داده می‌شود، نه یک Badge/لیست
 * ساختگی. محتوای پاپ‌آپ هم به همین دلیل یک Empty State واقعی است.
 *
 * بستن با کلیک بیرون: با `pointerdown` روی `document` (نه فقط
 * `mousedown`) تا روی موبایل/تاچ هم درست کار کند. بستن با کلید
 * Escape هم برای Accessibility اضافه شده.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasUnread = false;

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
          className="absolute end-0 top-full z-50 mt-2 w-72 rounded-2xl border border-black/5 bg-white p-4 shadow-[0_12px_32px_rgba(3,23,37,0.16)]"
        >
          <p className="text-sm font-semibold text-[var(--sf-ink)]">
            اعلان‌ها
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 py-6 text-center">
            <Bell
              className="h-8 w-8 text-gray-300"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <p className="text-sm text-gray-400">
              اعلانی برای نمایش وجود ندارد
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
