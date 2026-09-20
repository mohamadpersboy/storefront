"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { LineChart as LineChartIcon, X } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { formatNumber, TOMAN_GLYPH } from "@/lib/utils/format";
import type { WeeklyPricePoint } from "@/lib/storefront/get-price-history";
import {
  clampDragOffsetPx,
  shouldDismissBottomSheet,
  SHEET_TRANSITION_MS,
} from "@/lib/storefront/bottom-sheet-math";

type ProductPriceChartButtonProps = {
  history: WeeklyPricePoint[];
};

function subscribeNoop() {
  return () => {};
}
function getIsMountedSnapshot() {
  return true;
}
function getIsMountedServerSnapshot() {
  return false;
}

/**
 * آیا کامپوننت روی Client هیدریت شده — با `useSyncExternalStore`
 * (نه `useEffect` + `setState` دستی که قانون Purity ESLint پروژه
 * («Calling setState synchronously within an effect») آن را رد
 * می‌کند). این الگوی رسمی خودِ React برای «فقط بعد از Hydration
 * چیزی را نشان بده» است — در Render اول سمت Client (که باید دقیقاً
 * هم‌شکل خروجی Server باشد) `false` برمی‌گرداند، همان‌طور که
 * `getServerSnapshot` روی Server برمی‌گرداند؛ فقط از Render بعدی
 * `true` می‌شود.
 */
function useIsMounted(): boolean {
  return useSyncExternalStore(subscribeNoop, getIsMountedSnapshot, getIsMountedServerSnapshot);
}

/**
 * دکمه «نمودار قیمت» در Top Bar + پاپ‌آپ نمودار تغییرات هفتگی قیمت
 * (۸ هفته اخیر) — به درخواست صریح کارفرما.
 *
 * ظاهر نمودار عمداً هم‌الگو با `SalesTrendChart` داشبورد است (همان
 * `recharts` `AreaChart` با گرادیان زیر خط، همان شکل Tooltip/Grid) تا
 * زبان بصری نمودارها در کل پروژه یکسان بماند؛ فقط رنگ خط از
 * `--sf-accent` (نه رنگ ثابت Indigo داشبورد) چون این‌جا Storefront
 * است، و فرمت قیمت/تومان هم‌الگو با `ProductInfoHeader`
 * (`formatNumber` + `TOMAN_GLYPH`) است.
 *
 * `history`: فعلاً MOCK — نگاه کنید توضیح `getMockWeeklyPriceHistory`
 * برای دلیل (هنوز مدل Backend‌ای برای تاریخچه واقعی قیمت وجود ندارد).
 *
 * **باگ رفع‌شده (طبق اسکرین‌شات کارفرما — نمودار داخل خودِ نوار Top
 * Bar نمایش داده می‌شد، نه به‌عنوان پاپ‌آپ روی کل صفحه):** علتش
 * `backdrop-blur-xl` روی خودِ `ProductTopBar` بود — طبق مشخصات CSS،
 * هر عنصر با `backdrop-filter` (درست مثل `filter`/`transform`) یک
 * Containing Block تازه برای فرزندان `position: fixed` می‌سازد؛ چون
 * این پاپ‌آپ از داخل همان Top Bar رندر می‌شد، `fixed inset-0`‌اش
 * نسبت به خودِ نوار Top Bar (نه کل Viewport) محاسبه می‌شد و در همان
 * محدوده کوچک گیر می‌افتاد. رفع شد با `createPortal` به
 * `document.body` — پاپ‌آپ دیگر توسط هیچ Containing Block اجدادی
 * (نه این‌جا، نه هیچ Backdrop-filter/Transform آینده) محدود نمی‌شود.
 *
 * **Bottom-Sheet با انیمیشن + Drag-to-Dismiss (به درخواست صریح
 * کارفرما):** ورود با اسلاید از پایین (`translateY(100%)` →
 * `translateY(0)`، یک فریم بعد از Mount تا Transition واقعاً اجرا
 * شود)، خروج هم‌همان مسیر برعکس (چه با دکمه بستن/Backdrop، چه با
 * درگ رو‌به‌پایین بیشتر از آستانه — `shouldDismissBottomSheet` در
 * `bottom-sheet-math.ts`). یک Handle Bar (خط افقی کوچک) بالای
 * پاپ‌آپ، هم‌الگو با اکثر Bottom Sheetهای موبایل، نشان می‌دهد با
 * درگ رو‌به‌پایین بسته می‌شود؛ کل نوار عنوان (نه فقط خودِ خط) ناحیه
 * درگ است. حین خودِ درگ Transition خاموش است (ردیابی زنده انگشت،
 * بدون تأخیر CSS)؛ رهاکردن زیر آستانه، با Transition نرم به جای
 * اول برمی‌گردد.
 *
 * **باگ رفع‌شده (طبق اسکرین‌شات کارفرما — برچسب‌های هفته پایین
 * نمودار با برچسب قیمت `0م` تداخل داشتند):** `tickMargin` محور
 * افقی اضافه شد تا برچسب‌های هفته چند پیکسل پایین‌تر از خط/برچسب
 * قیمت پایینی قرار بگیرند.
 */
export function ProductPriceChartButton({ history }: ProductPriceChartButtonProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [dragOffsetPx, setDragOffsetPx] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const mounted = useIsMounted();

  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStartYRef = useRef<number | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function openSheet() {
    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpen(true);
  }

  function closeSheet() {
    setVisible(false);
    setDragOffsetPx(0);
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false);
      closeTimerRef.current = null;
    }, SHEET_TRANSITION_MS);
  }

  // یک فریم بعد از Mount، از `translateY(100%)` به `0` سوییچ می‌کند
  // تا مرورگر Transition اسلاید-بالا را واقعاً اجرا کند (اگر همان
  // فریم اول State بالا می‌رفت، مرورگر تغییر را قبل از Paint اول
  // می‌دید و هیچ Transition‌ای دیده نمی‌شد).
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeSheet();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function handleDragStart(event: React.PointerEvent<HTMLDivElement>) {
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

    const sheetHeightPx = sheetRef.current?.offsetHeight ?? 0;
    if (shouldDismissBottomSheet(dragOffsetPx, sheetHeightPx)) {
      closeSheet();
    } else {
      setDragOffsetPx(0);
    }
  }

  const popup = open && (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={closeSheet} aria-hidden="true" />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label="نمودار تغییرات قیمت"
        className="relative w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:rounded-3xl sm:pb-4"
        style={{
          transform: visible ? `translateY(${dragOffsetPx}px)` : "translateY(100%)",
          transition: isDragging ? "none" : `transform ${SHEET_TRANSITION_MS}ms cubic-bezier(0.32,0.72,0,1)`,
        }}
      >
        <div
          className="-mx-4 -mt-4 cursor-grab touch-none px-4 pt-3 pb-3 active:cursor-grabbing sm:mx-0 sm:mt-0 sm:px-0 sm:pt-0"
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-300" aria-hidden="true" />
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-[var(--sf-ink)]">
              تغییرات قیمت (۸ هفته اخیر)
            </p>
            <button
              type="button"
              onClick={closeSheet}
              aria-label="بستن"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
            >
              <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div dir="ltr" className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
              <defs>
                <linearGradient id="priceHistoryFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--sf-accent)" stopOpacity={0.22} />
                  <stop offset="100%" stopColor="var(--sf-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e4e4e7" />
              <XAxis
                dataKey="weekLabel"
                tickLine={false}
                axisLine={false}
                tickMargin={12}
                tick={{ fontSize: 11, fill: "#71717a" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#71717a" }}
                tickFormatter={(v: number) => `${Math.round(v / 1_000_000)}م`}
                width={32}
              />
              <Tooltip
                formatter={(value) => [`${formatNumber(Number(value))} ${TOMAN_GLYPH}`, "قیمت"]}
                contentStyle={{
                  direction: "rtl",
                  fontFamily: "inherit",
                  fontSize: 12,
                  borderRadius: 10,
                  border: "1px solid #e4e4e7",
                }}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke="var(--sf-accent)"
                strokeWidth={2}
                fill="url(#priceHistoryFill)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="نمودار تغییرات قیمت"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
      >
        <LineChartIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {mounted && popup ? createPortal(popup, document.body) : null}
    </>
  );
}
