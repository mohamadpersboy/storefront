"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function ReturnCheckModal({
  checkId,
  onCancel,
  onReturned,
}: {
  checkId: string;
  onCancel: () => void;
  onReturned: () => void;
}) {
  const [returnedAt, setReturnedAt] = useState<string | null>(null);
  const [returnedToName, setReturnedToName] = useState("");
  const [returnedToNationalId, setReturnedToNationalId] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!returnedAt) {
      setError("تاریخ عودت را وارد کنید");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/checks/${checkId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          returnedAt,
          returnedToName,
          returnedToNationalId: returnedToNationalId || undefined,
          reason,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }
      onReturned();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">عودت چک</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              تاریخ عودت
            </label>
            <JalaliDatePicker value={returnedAt} onChange={setReturnedAt} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام دریافت‌کننده چک عودتی
            </label>
            <Input value={returnedToName} onChange={(e) => setReturnedToName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              کد ملی (اختیاری)
            </label>
            <Input
              dir="ltr"
              value={returnedToNationalId}
              onChange={(e) => setReturnedToNationalId(digitsOnly(e.target.value).slice(0, 10))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              دلیل عودت
            </label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" variant="danger" size="sm" disabled={saving}>
            {saving ? "در حال ثبت..." : "تأیید عودت"}
          </Button>
        </div>
      </form>
    </div>
  );
}
