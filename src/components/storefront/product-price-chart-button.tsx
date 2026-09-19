"use client";

import { useEffect, useState } from "react";
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

type ProductPriceChartButtonProps = {
  history: WeeklyPricePoint[];
};

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
 */
export function ProductPriceChartButton({ history }: ProductPriceChartButtonProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="نمودار تغییرات قیمت"
        className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
      >
        <LineChartIcon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="نمودار تغییرات قیمت"
            className="relative w-full max-w-md rounded-t-3xl bg-white p-4 pb-[calc(env(safe-area-inset-bottom)+16px)] sm:rounded-3xl sm:pb-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[var(--sf-ink)]">
                تغییرات قیمت (۸ هفته اخیر)
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="بستن"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 active:bg-gray-200"
              >
                <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
              </button>
            </div>

            <div dir="ltr" className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
      )}
    </>
  );
}
