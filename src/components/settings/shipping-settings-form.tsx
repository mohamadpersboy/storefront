"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Settings {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
}

export function ShippingSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/shipping-settings")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setSettings(body.data);
        else setError(body.message ?? "خطا در دریافت تنظیمات");
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/shipping-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در ذخیره تنظیمات");
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-3 p-5">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="ارسال رایگان"
          description="اگر فعال باشد، بنر «ارسال رایگان برای خریدهای بالای مبلغ مشخص» در صفحه اصلی Storefront نمایش داده می‌شود"
        />
        <CardContent className="flex flex-col gap-3">
          <label className="flex w-fit items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={settings.freeShippingEnabled}
              onChange={(e) =>
                setSettings({ ...settings, freeShippingEnabled: e.target.checked })
              }
              className="size-4 rounded border-border"
            />
            فعال باشد
          </label>
          <div className="flex flex-col gap-1.5 sm:w-64">
            <label className="text-xs text-muted">
              حداقل مبلغ سفارش برای ارسال رایگان (تومان)
            </label>
            <Input
              type="number"
              dir="ltr"
              min={0}
              disabled={!settings.freeShippingEnabled}
              value={settings.freeShippingThreshold}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  freeShippingThreshold: Number(e.target.value) || 0,
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted">
        نکته: این فقط یک پیام تبلیغاتی در صفحه اصلی است — محاسبه واقعی
        هزینه ارسال در Checkout هنوز مستقل و دستی است (بند Known Issues:
        موتور محاسبه خودکار هزینه ارسال هنوز ساخته نشده).
      </p>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {savedAt ? <p className="text-sm text-green-700">تنظیمات ذخیره شد.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </Button>
      </div>
    </form>
  );
}
