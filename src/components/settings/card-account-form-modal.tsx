"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { digitsOnly } from "@/lib/utils/format";

interface ApiBank {
  id: string;
  name: string;
  isActive: boolean;
}

export interface CardAccountFormValues {
  id?: string;
  cardNumber: string;
  shabaNumber: string;
  bankId: string;
  accountNumber: string;
  ownerName: string;
}

export function CardAccountFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: CardAccountFormValues;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [cardNumber, setCardNumber] = useState(initial?.cardNumber ?? "");
  const [shabaNumber, setShabaNumber] = useState(initial?.shabaNumber ?? "");
  const [bankId, setBankId] = useState(initial?.bankId ?? "");
  const [accountNumber, setAccountNumber] = useState(initial?.accountNumber ?? "");
  const [ownerName, setOwnerName] = useState(initial?.ownerName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/banks")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setBanks(body.data.filter((b: ApiBank) => b.isActive));
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const url = initial?.id ? `/api/v1/card-accounts/${initial.id}` : "/api/v1/card-accounts";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardNumber,
          shabaNumber: shabaNumber.trim().toUpperCase(),
          bankId,
          accountNumber,
          ownerName,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }
      onSaved();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative my-8 w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {initial?.id ? "ویرایش کارت/حساب" : "کارت/حساب جدید"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">بانک</label>
            <Combobox
              value={bankId}
              onChange={setBankId}
              placeholder="انتخاب بانک"
              options={banks.map((b) => ({ value: b.id, label: b.name }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              شماره کارت
            </label>
            <Input
              value={cardNumber}
              onChange={(e) => setCardNumber(digitsOnly(e.target.value).slice(0, 16))}
              placeholder="۱۶ رقم بدون خط تیره"
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              شماره شبا
            </label>
            <Input
              value={shabaNumber}
              onChange={(e) => setShabaNumber(e.target.value)}
              placeholder="IR..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              شماره حساب
            </label>
            <Input
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام صاحب حساب
            </label>
            <Input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "در حال ذخیره..." : "ذخیره"}
          </Button>
        </div>
      </form>
    </div>
  );
}
