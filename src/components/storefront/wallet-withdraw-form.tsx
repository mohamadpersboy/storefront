"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatTomanGlyph } from "@/lib/utils/format";

export type WithdrawFormDefaults = {
  ownerName: string;
  cardNumber: string;
  iban: string;
};

/**
 * فرم درخواست تسویه — اگر کاربر قبلاً «اطلاعات بانکی» را ذخیره کرده
 * باشد، این فرم با همان مقادیر پیش‌پر می‌شود (نگاه کنید
 * `models/CustomerBankAccount.ts`) تا کاربر مجبور نباشد هر بار
 * دوباره شماره کارت/شبا را تایپ کند؛ در عین حال هر دو فیلد قابل
 * ویرایش می‌مانند چون مقصد هر درخواست تسویه یک Snapshot مستقل است
 * (توضیح کامل در همان Model).
 */
export function WalletWithdrawForm({
  balance,
  defaults,
}: {
  balance: number;
  defaults: WithdrawFormDefaults;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState<number | "">("");
  const [ownerName, setOwnerName] = useState(defaults.ownerName);
  const [cardNumber, setCardNumber] = useState(defaults.cardNumber);
  const [iban, setIban] = useState(defaults.iban);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      const res = await fetch("/api/v1/wallet/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, ownerName, cardNumber, iban }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setFormError(body.message ?? "ثبت درخواست تسویه ممکن نشد");
        setErrors(body.errors ?? {});
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
          {" — "}مبلغ بلافاصله از کیف پول کسر و بعد از بررسی به حساب شما واریز می‌شود.
        </span>
      </div>

      <div className="space-y-4 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div>
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

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            نام صاحب حساب
          </label>
          <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          {errors.ownerName && <p className="mt-1 text-xs text-danger">{errors.ownerName[0]}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره کارت (۱۶ رقم)
          </label>
          <Input
            dir="ltr"
            maxLength={16}
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره شبا (با IR)
          </label>
          <Input dir="ltr" value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} />
        </div>

        {errors.cardNumber && <p className="text-xs text-danger">{errors.cardNumber[0]}</p>}
      </div>

      {formError && <p className="text-xs text-danger">{formError}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        <ArrowLeftRight className="size-4" strokeWidth={1.75} aria-hidden="true" />
        {submitting ? "در حال ثبت…" : "ثبت درخواست تسویه"}
      </Button>
    </form>
  );
}
