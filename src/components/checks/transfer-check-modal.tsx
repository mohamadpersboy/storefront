"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function TransferCheckModal({
  checkId,
  onCancel,
  onTransferred,
}: {
  checkId: string;
  onCancel: () => void;
  onTransferred: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/v1/checks/${checkId}/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          nationalId: nationalId || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }
      onTransferred();
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
        <h2 className="mb-4 text-sm font-semibold text-foreground">انتقال چک</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام گیرنده انتقال
            </label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام خانوادگی گیرنده انتقال
            </label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              کد ملی (اختیاری)
            </label>
            <Input
              dir="ltr"
              value={nationalId}
              onChange={(e) => setNationalId(digitsOnly(e.target.value).slice(0, 10))}
            />
          </div>

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "در حال ثبت..." : "تأیید انتقال"}
          </Button>
        </div>
      </form>
    </div>
  );
}
