"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface Settings {
  enabled: boolean;
  maxReferralsPerUser: number | null;
  rewardDiscountPercentage: number;
  rewardMaxDiscountAmount: number | null;
  minInviteeOrderAmount: number;
  rewardCouponValidityDays: number;
  totalReferrals: number;
  totalRewarded: number;
}

export function ReferralSettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/v1/referral-settings")
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
      const res = await fetch("/api/v1/referral-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: settings.enabled,
          maxReferralsPerUser: settings.maxReferralsPerUser,
          rewardDiscountPercentage: settings.rewardDiscountPercentage,
          rewardMaxDiscountAmount: settings.rewardMaxDiscountAmount,
          minInviteeOrderAmount: settings.minInviteeOrderAmount,
          rewardCouponValidityDays: settings.rewardCouponValidityDays,
        }),
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
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader
          title="آمار کلی"
          description="نمای فقط‌خواندنی — برای گزارش کامل، مدل Referral در دیتابیس قابل بررسی است"
        />
        <CardContent className="grid grid-cols-2 gap-3 sm:w-96">
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {settings.totalReferrals.toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-muted">کل دعوت‌های ثبت‌شده</p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">
              {settings.totalRewarded.toLocaleString("fa-IR")}
            </p>
            <p className="text-xs text-muted">پاداش صادرشده</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="دعوت دوستان"
          description="اگر فعال باشد، کد رفرال هر مشتری بعد از اولین خرید خودش فعال می‌شود و می‌تواند دوستانش را دعوت کند"
        />
        <CardContent className="flex flex-col gap-4">
          <label className="flex w-fit items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="size-4 rounded border-border"
            />
            فعال باشد
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">
                حداکثر تعداد دعوت هر کاربر (خالی = نامحدود)
              </label>
              <Input
                type="number"
                dir="ltr"
                min={1}
                disabled={!settings.enabled}
                value={settings.maxReferralsPerUser ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxReferralsPerUser: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="نامحدود"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">درصد تخفیف پاداش دعوت‌کننده</label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                max={100}
                disabled={!settings.enabled}
                value={settings.rewardDiscountPercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rewardDiscountPercentage: Number(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">
                سقف مبلغ تخفیف پاداش، تومان (خالی = بدون سقف)
              </label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                disabled={!settings.enabled}
                value={settings.rewardMaxDiscountAmount ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rewardMaxDiscountAmount: e.target.value === "" ? null : Number(e.target.value),
                  })
                }
                placeholder="بدون سقف"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">
                حداقل مبلغ اولین خرید دعوت‌شده، تومان
              </label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                disabled={!settings.enabled}
                value={settings.minInviteeOrderAmount}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minInviteeOrderAmount: Number(e.target.value) || 0,
                  })
                }
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">مدت اعتبار کد پاداش (روز)</label>
              <Input
                type="number"
                dir="ltr"
                min={1}
                disabled={!settings.enabled}
                value={settings.rewardCouponValidityDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    rewardCouponValidityDays: Number(e.target.value) || 1,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted">
        نکته: پاداش فقط یک‌بار، دقیقاً در لحظهٔ ثبت اولین سفارش دعوت‌شده
        بررسی می‌شود؛ اگر آن سفارش زیر «حداقل مبلغ» بود یا سقف دعوت
        دعوت‌کننده پر شده بود، آن دعوت دیگر واجد شرایط پاداش نمی‌شود
        (سفارش‌های بعدی همان مشتری اثری روی این رفرال ندارند).
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
