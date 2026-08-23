"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface ColorFormValues {
  id?: string;
  name: string;
  hexCode: string;
}

export function ColorFormModal({
  initial,
  onCancel,
  onSaved,
}: {
  initial?: ColorFormValues;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [hexCode, setHexCode] = useState(initial?.hexCode ?? "#4F46E5");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("نام رنگ باید حداقل ۲ حرف باشد");
      return;
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(hexCode)) {
      setError("کد رنگ معتبر نیست");
      return;
    }

    setSaving(true);
    try {
      const url = initial?.id ? `/api/v1/colors/${initial.id}` : "/api/v1/colors";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, hexCode }),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative w-full max-w-sm rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">
          {initial?.id ? "ویرایش رنگ" : "رنگ جدید"}
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام رنگ
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً قرمز آجری"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              کد رنگ
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={/^#[0-9A-Fa-f]{6}$/.test(hexCode) ? hexCode : "#000000"}
                onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                className="size-11 shrink-0 cursor-pointer rounded-[var(--radius-md)] border border-border bg-white p-1"
                aria-label="انتخاب رنگ"
              />
              <Input
                dir="ltr"
                value={hexCode}
                onChange={(e) => setHexCode(e.target.value.toUpperCase())}
                placeholder="#RRGGBB"
                className="flex-1"
              />
            </div>
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
