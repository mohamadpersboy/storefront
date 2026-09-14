"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type BankInfoValues = {
  ownerName: string;
  bankName: string;
  cardNumber: string;
  iban: string;
};

/**
 * فرم اطلاعات بانکی — یک رکورد در ازای هر کاربر، با `PUT` Upsert
 * می‌شود (چه اولین بار باشد چه ویرایش، همان یک Endpoint). توضیح
 * کامل تفاوت این مدل با مقصد درخواست برداشت در
 * `models/CustomerBankAccount.ts`.
 *
 * `onSaved`/`onCancel` اختیاری هستند: وقتی این فرم داخل
 * `BankInfoSection` و برای *ویرایش* یک رکورد موجود باز می‌شود، والد
 * می‌خواهد بعد از ذخیره موفق یا انصراف به نمای «کارت» برگردد، بدون
 * Navigation به صفحه دیگر (برخلاف فرم آدرس که همیشه به لیست
 * برمی‌گردد).
 */
export function BankInfoForm({
  initialValues,
  onSaved,
  onCancel,
}: {
  initialValues: BankInfoValues;
  onSaved?: (saved: BankInfoValues) => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<BankInfoValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof BankInfoValues>(key: K, value: BankInfoValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      const res = await fetch("/api/v1/account/bank-info", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setFormError(body.message ?? "ذخیره اطلاعات بانکی ممکن نشد");
        setErrors(body.errors ?? {});
        return;
      }

      router.refresh();
      onSaved?.({
        ownerName: body.data?.ownerName ?? values.ownerName,
        bankName: body.data?.bankName ?? values.bankName,
        cardNumber: body.data?.cardNumber ?? values.cardNumber,
        iban: body.data?.iban ?? values.iban,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
      <div className="space-y-4 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <p className="flex items-start gap-1.5 text-xs text-[var(--sf-ink)]/50">
          <Landmark className="mt-0.5 size-3.5 shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
          این اطلاعات فقط برای واریز وجه (مثلاً بازگشت وجه یا برداشت از کیف
          پول) استفاده می‌شود.
        </p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            نام صاحب حساب
          </label>
          <Input value={values.ownerName} onChange={(e) => update("ownerName", e.target.value)} />
          {errors.ownerName && (
            <p className="mt-1 text-xs text-danger">{errors.ownerName[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            نام بانک (اختیاری)
          </label>
          <Input
            placeholder="مثلاً بانک تجارت"
            value={values.bankName}
            onChange={(e) => update("bankName", e.target.value)}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره کارت (۱۶ رقم)
          </label>
          <Input
            dir="ltr"
            maxLength={16}
            value={values.cardNumber}
            onChange={(e) => update("cardNumber", e.target.value.replace(/[^\d]/g, ""))}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره شبا (با IR)
          </label>
          <Input
            dir="ltr"
            value={values.iban}
            onChange={(e) => update("iban", e.target.value.toUpperCase())}
          />
        </div>

        {errors.cardNumber && (
          <p className="text-xs text-danger">{errors.cardNumber[0]}</p>
        )}
      </div>

      {formError && <p className="text-xs text-danger">{formError}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "در حال ذخیره…" : "ذخیره اطلاعات بانکی"}
        </Button>
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
            انصراف
          </Button>
        )}
      </div>
    </form>
  );
}
