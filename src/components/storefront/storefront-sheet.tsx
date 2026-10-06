"use client";

import { getOverlayRoot } from "@/lib/storefront/overlay-root";
import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import {
  clampDragOffsetPx,
  shouldDismissBottomSheet,
  SHEET_TRANSITION_MS,
} from "@/lib/storefront/bottom-sheet-math";
import { useScrollLock } from "@/components/storefront/use-scroll-lock";

type StorefrontSheetProps = {
  open: boolean;
  /** پس از پایان انیمیشن خروج صدا زده می‌شود؛ والد باید `open` را false کند. */
  onClose: () => void;
  ariaLabel: string;
  /** عنوان/خلاصه — داخل ناحیه Drag قرار می‌گیرد. */
  header: ReactNode;
  children: ReactNode;
  /** بالای محتوای اسکرول‌شونده نیست؛ مثلاً Pagination. */
  footer?: ReactNode;
  /** دکمه‌ای که Sheet را باز کرد — Focus بعد از بستن به آن برمی‌گردد. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** وقتی Lightbox روی Sheet باز است، Escape باید فقط آن را ببندد. */
  closeOnEscape?: boolean;
  /** Ref ناحیه اسکرول (مثلاً برای بازگشت به بالا هنگام تغییر صفحه). */
  scrollRef?: RefObject<HTMLDivElement | null>;
  /** ارتفاع ثابت و بلند (نزدیک بالای صفحه در موبایل) — برای پاپ‌آپ‌های پرمحتوا. */
  tall?: boolean;
};

const DESKTOP_QUERY = "(min-width: 640px) and (max-width: 1023.98px)";

/**
 * پوسته مشترک Storefront: موبایل = Bottom Sheet (اسلاید از پایین،
 * Drag-to-dismiss روی Handle/هدر)، دسکتاپ = Modal وسط. منطق Drag از
 * `bottom-sheet-math.ts` می‌آید (همان آستانه‌های نمودار قیمت)؛
 * `ProductPriceChartButton` عمداً دست‌نخورده است.
 * Portal به `document.body` — هیچ Containing Block اجدادی (Backdrop
 * Filter/Transform) آن را محدود نمی‌کند. فقط وقتی `open` است رندر
 * می‌شود، پس SSR/Hydration مشکلی ندارد.
 */
export function StorefrontSheet({
  open,
  onClose,
  ariaLabel,
  header,
  children,
  footer,
  returnFocusRef,
  closeOnEscape = true,
  scrollRef,
  tall = false,
}: StorefrontSheetProps) {
  const [visible, setVisible] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useScrollLock(open);

  // یک فریم بعد از Mount: translateY(100%) → 0 تا Transition واقعاً اجرا شود.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      setVisible(true);
      dialogRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

  // بازگرداندن Focus + پاک‌سازی Timer (بدون Listener باقی‌مانده).
  useEffect(() => {
    if (!open) return;
    const active =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const target = returnFocusRef?.current ?? active;
    return () => {
      target?.focus();
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
    };
  }, [open, returnFocusRef]);

  function requestClose() {
    if (closeTimerRef.current !== null) return;
    setVisible(false);
    setDragOffsetPx(0);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, SHEET_TRANSITION_MS);
  }

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") requestClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, closeOnEscape]);

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
    // Drag فقط موبایل: روی دسکتاپ Modal با ماوس جابه‌جا نمی‌شود.
    if (window.matchMedia(DESKTOP_QUERY).matches) return;
    dragStartYRef.current = event.clientY;
    setIsDragging(true);
  }

  function handleDragMove(event: React.PointerEvent<HTMLDivElement>) {
    if (dragStartYRef.current === null) return;
    setDragOffsetPx(clampDragOffsetPx(event.clientY - dragStartYRef.current));
  }

  function handleDragEnd() {
    if (dragStartYRef.current === null) return;
    dragStartYRef.current = null;
    setIsDragging(false);
    const sheetHeightPx = dialogRef.current?.offsetHeight ?? 0;
    if (shouldDismissBottomSheet(dragOffsetPx, sheetHeightPx)) requestClose();
    else setDragOffsetPx(0);
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center tab:items-center tab:p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={requestClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
        className={`relative flex w-full max-w-lg flex-col rounded-t-3xl bg-white outline-none tab:rounded-3xl ${
          tall
            ? "h-[calc(100dvh-3.5rem)] max-h-[calc(100dvh-3.5rem)] tab:h-[85vh] tab:max-h-[85vh]"
            : "max-h-[85vh]"
        }`}
        style={{
          transform: visible
            ? `translateY(${dragOffsetPx}px)`
            : "translateY(100%)",
          transition: isDragging
            ? "none"
            : `transform ${SHEET_TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1)`,
        }}
      >
        <div
          className="shrink-0 cursor-grab touch-none px-4 pt-3 pb-3 active:cursor-grabbing tab:cursor-default tab:pt-4"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div
            className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300 tab:hidden"
            aria-hidden="true"
          />
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">{header}</div>
            <button
              type="button"
              onClick={requestClose}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label="بستن"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4"
        >
          {children}
        </div>

        {footer ? (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)]">
            {footer}
          </div>
        ) : (
          <div className="shrink-0 pb-[env(safe-area-inset-bottom)]" />
        )}
      </div>
    </div>,
    getOverlayRoot(),
  );
}
