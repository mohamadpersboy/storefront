"use client";

import { useState } from "react";
import { Wallet, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTomanGlyph } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

const QUICK_AMOUNTS = [50_000, 100_000, 200_000, 500_000];

/**
 * فرم شارژ کیف پول — کاربر مبلغ را انتخاب/وارد می‌کند، سرور یک
 * `paymentUrl` زرین‌پال برمی‌گرداند و مرورگر کامل به آن هدایت
 * می‌شود (نه Navigation داخلی Next.js، چون مقصد یک دامنه دیگر است).
 * بعد از پرداخت، زرین‌پال به `/wallet/topup/result` برمی‌گرداند —
 * صفحه‌ای که از قبل در پروژه وجود دارد.
 */
export function WalletTopupForm() {
  const [amount, setAmount] = useState<number | "">("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || amount < 10_000) {
      setError("حداقل مبلغ شارژ ۱۰,۰۰۰ تومان است");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/wallet/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "شروع شارژ ممکن نشد");
        setSubmitting(false);
        return;
      }

      window.location.href = body.data.paymentUrl;
    } catch {
      setError("ارتباط با درگاه پرداخت برقرار نشد");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
      <div className="space-y-4 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <p className="flex items-center gap-1.5 text-xs text-[var(--sf-ink)]/50">
          <Wallet className="size-3.5 text-emerald-600" strokeWidth={1.75} aria-hidden="true" />
          مبلغ شارژ به کیف پول شما اضافه می‌شود و برای خریدهای بعدی قابل استفاده است.
        </p>

        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--sf-ink)]/70">
            انتخاب سریع
          </label>
          <div className="grid grid-cols-4 gap-2">
            {QUICK_AMOUNTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAmount(value)}
                className={cn(
                  "rounded-[var(--radius-md)] border py-2.5 text-xs font-bold transition-colors",
                  amount === value
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-black/5 bg-gray-50 text-[var(--sf-ink)]/60 active:bg-gray-100",
                )}
              >
                {(value / 1000).toLocaleString("fa-IR")}k
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            یا مبلغ دلخواه (تومان)
          </label>
          <Input
            dir="ltr"
            inputMode="numeric"
            value={amount === "" ? "" : String(amount)}
            onChange={(e) => {
              const digits = e.target.value.replace(/[^\d]/g, "");
              setAmount(digits === "" ? "" : Number(digits));
            }}
          />
          {typeof amount === "number" && amount > 0 && (
            <p className="mt-1.5 text-xs text-[var(--sf-ink)]/50">{formatTomanGlyph(amount)}</p>
          )}
        </div>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {submitting ? "در حال انتقال به درگاه…" : "پرداخت و شارژ کیف پول"}
      </Button>
    </form>
  );
}
