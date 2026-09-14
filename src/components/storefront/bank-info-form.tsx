"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export type BankInfoValues = {
  ownerName: string;
  cardNumber: string;
  iban: string;
};

/**
 * فرم اطلاعات بانکی — یک رکورد در ازای هر کاربر، با `PUT` Upsert
 * می‌شود (چه اولین بار باشد چه ویرایش، همان یک Endpoint). توضیح
 * کامل تفاوت این مدل با مقصد درخواست برداشت در
 * `models/CustomerBankAccount.ts`.
 */
export function BankInfoForm({ initialValues }: { initialValues: BankInfoValues }) {
  const router = useRouter();
  const [values, setValues] = useState<BankInfoValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof BankInfoValues>(key: K, value: BankInfoValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setSuccessMessage(null);
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

      setSuccessMessage(body.message ?? "اطلاعات بانکی ذخیره شد");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
      <div className="space-y-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <p className="text-xs text-[var(--sf-ink)]/50">
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
      {successMessage && <p className="text-xs text-emerald-600">{successMessage}</p>}

      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "در حال ذخیره…" : "ذخیره اطلاعات بانکی"}
      </Button>
    </form>
  );
}
