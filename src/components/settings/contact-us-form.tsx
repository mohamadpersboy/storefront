"use client";

import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { NeshanMapPicker } from "@/components/maps/neshan-map-picker";

interface ContactUsData {
  phone: string;
  secondaryPhone: string;
  email: string;
  address: string;
  workingHours: string;
  latitude: number | null;
  longitude: number | null;
}

export function ContactUsForm() {
  const [data, setData] = useState<ContactUsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    fetch("/api/v1/contact-us")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setData(body.data);
        else setError(body.message ?? "خطا در دریافت اطلاعات");
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد"));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaving(true);
    setError(null);
    setFieldErrors({});
    try {
      const res = await fetch("/api/v1/contact-us", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در ذخیره اطلاعات");
        if (body.errors) setFieldErrors(body.errors);
        return;
      }
      setSavedAt(Date.now());
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  if (!data) {
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
          title="تماس با ما"
          description="این اطلاعات در صفحه «تماس با ما» و فوتر فروشگاه (Storefront) نمایش داده می‌شوند"
        />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              تلفن
            </label>
            <Input
              dir="ltr"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              placeholder="09xxxxxxxxx"
            />
            {fieldErrors.phone ? (
              <p className="mt-1 text-xs text-danger">{fieldErrors.phone[0]}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              تلفن دوم (اختیاری)
            </label>
            <Input
              dir="ltr"
              value={data.secondaryPhone}
              onChange={(e) => setData({ ...data, secondaryPhone: e.target.value })}
              placeholder="0XX-XXXXXXXX"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              ایمیل
            </label>
            <Input
              dir="ltr"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              placeholder="info@example.com"
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-danger">{fieldErrors.email[0]}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              آدرس
            </label>
            <Textarea
              rows={3}
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              placeholder="آدرس فروشگاه/دفتر..."
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              ساعات کاری
            </label>
            <Input
              value={data.workingHours}
              onChange={(e) => setData({ ...data, workingHours: e.target.value })}
              placeholder="شنبه تا پنجشنبه، ۹ الی ۱۸"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground/80">
                موقعیت روی نقشه (اختیاری)
              </label>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setMapOpen((v) => !v)}
              >
                <MapPin className="size-4" />
                {mapOpen ? "بستن نقشه" : "انتخاب روی نقشه"}
              </Button>
            </div>
            {data.latitude != null && data.longitude != null ? (
              <p dir="ltr" className="text-xs text-muted">
                {data.latitude.toFixed(6)}, {data.longitude.toFixed(6)}
              </p>
            ) : (
              <p className="text-xs text-muted">موقعیتی ثبت نشده است</p>
            )}
            {mapOpen ? (
              <NeshanMapPicker
                initialLatitude={data.latitude ?? undefined}
                initialLongitude={data.longitude ?? undefined}
                onConfirm={(result) => {
                  setData({
                    ...data,
                    latitude: result.latitude,
                    longitude: result.longitude,
                    address: result.addressLine || data.address,
                  });
                  setMapOpen(false);
                }}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {savedAt ? <p className="text-sm text-green-700">اطلاعات ذخیره شد.</p> : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ذخیره..." : "ذخیره تنظیمات"}
        </Button>
      </div>
    </form>
  );
}
