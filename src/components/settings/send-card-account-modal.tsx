"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { digitsOnly } from "@/lib/utils/format";

export function SendCardAccountModal({
  cardAccountId,
  cardLabel,
  onCancel,
  onSent,
}: {
  cardAccountId: string;
  cardLabel: string;
  onCancel: () => void;
  onSent: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      const res = await fetch(`/api/v1/card-accounts/${cardAccountId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }
      onSent();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-1 text-sm font-semibold text-foreground">ارسال اطلاعات کارت</h2>
        <p className="mb-4 text-xs text-muted">{cardLabel}</p>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            شماره موبایل مشتری
          </label>
          <Input
            dir="ltr"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(digitsOnly(e.target.value).slice(0, 11))}
            placeholder="09xxxxxxxxx"
          />
        </div>

        {error ? <p className="mt-2 text-xs text-danger">{error}</p> : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={sending}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={sending}>
            {sending ? "در حال ارسال..." : "ارسال پیامک"}
          </Button>
        </div>
      </form>
    </div>
  );
}
