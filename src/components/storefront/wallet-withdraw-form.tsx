"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Info, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTomanGlyph } from "@/lib/utils/format";

export type WithdrawDestination = {
  ownerName: string;
  bankName: string | null;
  cardNumber: string | null;
  iban: string | null;
};

function maskDestinationNumber(destination: WithdrawDestination): string {
  if (destination.cardNumber) {
    return `${destination.cardNumber.slice(0, 4)} •••• •••• ${destination.cardNumber.slice(-4)}`;
  }
  if (destination.iban) {
    return `${destination.iban.slice(0, 4)} •••••••••••••••••••• ${destination.iban.slice(-4)}`;
  }
  return "—";
}

/**
 * فرم درخواست تسویه — فقط مبلغ می‌گیرد. مقصد واریز دیگر اینجا
 * پرسیده نمی‌شود؛ همیشه همان «اطلاعات بانکی» ذخیره‌شده کاربر است
 * (نمایش خلاصه/فقط‌خواندنی برای اطمینان کاربر از مقصد صحیح، با
 * لینک ویرایش در صورت نیاز). این کامپوننت اصلاً رندر نمی‌شود اگر
 * کاربر هنوز اطلاعات بانکی ثبت نکرده باشد — آن حالت را خود صفحه
 * (`wallet/withdraw/page.tsx`) با یک پیام جدا نشان می‌دهد.
 */
export function WalletWithdrawForm({
  balance,
  destination,
}: {
  balance: number;
  destination: WithdrawDestination;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/v1/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setFormError(body.message ?? "ثبت درخواست تسویه ممکن نشد");
        return;
      }

      router.push("/account/wallet");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
      <div className="flex items-start gap-2 rounded-[var(--radius-lg)] border border-black/5 bg-white px-4 py-3 text-xs text-[var(--sf-ink)]/60">
        <Info className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
        <span>
          موجودی قابل تسویه: <strong className="text-[var(--sf-ink)]">{formatTomanGlyph(balance)}</strong>
          {" — "}مبلغ بلافاصله از کیف پول کسر و بعد از بررسی به حساب زیر واریز می‌شود.
        </span>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-violet-50 text-violet-600">
            <Landmark className="size-5" strokeWidth={1.75} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--sf-ink)]">
              {destination.bankName || "حساب مقصد"}
            </p>
            <p dir="ltr" className="mt-0.5 text-xs text-[var(--sf-ink)]/60">
              {maskDestinationNumber(destination)}
            </p>
            <p className="mt-0.5 text-xs text-[var(--sf-ink)]/50">{destination.ownerName}</p>
          </div>
        </div>
      </div>

      <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
          مبلغ تسویه (تومان)
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
      </div>

      {formError && <p className="text-xs text-danger">{formError}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        <ArrowLeftRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {submitting ? "در حال ثبت…" : "ثبت درخواست تسویه"}
      </Button>
    </form>
  );
}
