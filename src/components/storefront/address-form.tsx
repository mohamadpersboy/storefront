"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProvinceCitySelect } from "@/components/addresses/province-city-select";
import { NeshanMapPicker } from "@/components/maps/neshan-map-picker";

export type AddressFormValues = {
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
};

const EMPTY_VALUES: AddressFormValues = {
  title: "",
  recipientName: "",
  phoneNumber: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

/**
 * فرم مشترک افزودن/ویرایش آدرس — از همان قطعات آماده و تأییدشده
 * پروژه استفاده می‌کند تا آدرس Storefront یک UI موازی نباشد:
 * `ProvinceCitySelect` (بدون Input آزاد برای استان/شهر، طبق بند ۳
 * سند Audit) و `NeshanMapPicker` (بند ۵ همان سند) — دقیقاً همان دو
 * کامپوننتی که فرم آدرس سفارش در Dashboard هم استفاده می‌کند.
 */
export function AddressForm({
  mode,
  addressId,
  initialValues,
}: {
  mode: "create" | "edit";
  addressId?: string;
  initialValues?: AddressFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<AddressFormValues>(initialValues ?? EMPTY_VALUES);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function update<K extends keyof AddressFormValues>(key: K, value: AddressFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setErrors({});

    try {
      const res = await fetch(
        mode === "create" ? "/api/v1/addresses" : `/api/v1/addresses/${addressId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const body = await res.json();

      if (!res.ok || !body.success) {
        setFormError(body.message ?? "ثبت آدرس ممکن نشد");
        setErrors(body.errors ?? {});
        return;
      }

      router.push("/account/addresses");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!addressId) return;
    if (!window.confirm("این آدرس حذف شود؟")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/addresses/${addressId}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.message ?? "حذف آدرس ممکن نشد");
        return;
      }
      router.push("/account/addresses");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-4 py-4 sm:px-6">
      <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-bold text-[var(--sf-ink)]">موقعیت روی نقشه</p>
          <button
            type="button"
            onClick={() => setShowMapPicker((v) => !v)}
            className="text-xs font-medium text-primary underline"
          >
            {showMapPicker ? "بستن نقشه" : "انتخاب روی نقشه"}
          </button>
        </div>
        {showMapPicker && (
          <NeshanMapPicker
            initialLatitude={values.latitude}
            initialLongitude={values.longitude}
            onConfirm={(result) => {
              setValues((prev) => ({
                ...prev,
                latitude: result.latitude,
                longitude: result.longitude,
                province: result.province || prev.province,
                city: result.city || prev.city,
                addressLine: result.addressLine || prev.addressLine,
              }));
              setShowMapPicker(false);
            }}
          />
        )}
        {!showMapPicker && typeof values.latitude === "number" && (
          <p dir="ltr" className="text-xs text-[var(--sf-ink)]/50">
            {values.latitude.toFixed(6)}, {values.longitude?.toFixed(6)}
          </p>
        )}
      </div>

      <div className="space-y-3 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            عنوان آدرس (مثلاً خانه، محل کار)
          </label>
          <Input value={values.title} onChange={(e) => update("title", e.target.value)} />
          {errors.title && <p className="mt-1 text-xs text-danger">{errors.title[0]}</p>}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            نام گیرنده
          </label>
          <Input
            value={values.recipientName}
            onChange={(e) => update("recipientName", e.target.value)}
          />
          {errors.recipientName && (
            <p className="mt-1 text-xs text-danger">{errors.recipientName[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            شماره تماس گیرنده
          </label>
          <Input
            dir="ltr"
            maxLength={11}
            value={values.phoneNumber}
            onChange={(e) => update("phoneNumber", e.target.value.replace(/[^\d]/g, ""))}
          />
          {errors.phoneNumber && (
            <p className="mt-1 text-xs text-danger">{errors.phoneNumber[0]}</p>
          )}
        </div>

        <ProvinceCitySelect
          provinceName={values.province}
          cityName={values.city}
          onChange={({ provinceName, cityName }) => {
            update("province", provinceName);
            update("city", cityName);
          }}
        />

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            آدرس کامل
          </label>
          <Textarea
            rows={2}
            value={values.addressLine}
            onChange={(e) => update("addressLine", e.target.value)}
          />
          {errors.addressLine && (
            <p className="mt-1 text-xs text-danger">{errors.addressLine[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-[var(--sf-ink)]/70">
            کد پستی
          </label>
          <Input
            dir="ltr"
            value={values.postalCode}
            onChange={(e) => update("postalCode", e.target.value.replace(/[^\d]/g, ""))}
          />
          {errors.postalCode && (
            <p className="mt-1 text-xs text-danger">{errors.postalCode[0]}</p>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm text-[var(--sf-ink)]/80">
          <input
            type="checkbox"
            checked={values.isDefault}
            onChange={(e) => update("isDefault", e.target.checked)}
            className="size-4 rounded border-border"
          />
          آدرس پیش‌فرض من باشد
        </label>
      </div>

      {formError && <p className="text-xs text-danger">{formError}</p>}

      <div className="flex gap-3">
        <Button type="submit" disabled={submitting} className="flex-1">
          {submitting ? "در حال ذخیره…" : "ذخیره آدرس"}
        </Button>
        {mode === "edit" && (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "…" : "حذف"}
          </Button>
        )}
      </div>
    </form>
  );
}
