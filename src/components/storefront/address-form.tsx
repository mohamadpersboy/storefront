"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Briefcase, MapPinned, MapPin, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ProvinceCitySelect } from "@/components/addresses/province-city-select";
import { NeshanMapPicker } from "@/components/maps/neshan-map-picker";
import { cn } from "@/lib/utils/cn";
import type { AddressType } from "@/models/Address";

export type AddressFormValues = {
  addressType: AddressType;
  customTitle: string;
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
  addressType: "home",
  customTitle: "",
  recipientName: "",
  phoneNumber: "",
  province: "",
  city: "",
  addressLine: "",
  postalCode: "",
  isDefault: false,
};

const ADDRESS_TYPE_OPTIONS: Array<{
  value: AddressType;
  label: string;
  icon: typeof Home;
  activeClassName: string;
}> = [
  {
    value: "home",
    label: "خانه",
    icon: Home,
    activeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  {
    value: "work",
    label: "محل کار",
    icon: Briefcase,
    activeClassName: "border-blue-200 bg-blue-50 text-blue-700",
  },
  {
    value: "other",
    label: "سایر",
    icon: MapPinned,
    activeClassName: "border-violet-200 bg-violet-50 text-violet-700",
  },
];

/**
 * فرم مشترک افزودن/ویرایش آدرس — از همان قطعات آماده و تأییدشده
 * پروژه استفاده می‌کند تا آدرس Storefront یک UI موازی نباشد:
 * `ProvinceCitySelect` (بدون Input آزاد برای استان/شهر، طبق بند ۳
 * سند Audit) و `NeshanMapPicker` (بند ۵ همان سند) — دقیقاً همان دو
 * کامپوننتی که فرم آدرس سفارش در Dashboard هم استفاده می‌کند.
 *
 * عنوان آدرس دیگر یک Input آزاد نیست: کاربر از سه گزینه محدود
 * (خانه/محل کار/سایر) با آیکون انتخاب می‌کند؛ فقط برای «سایر» یک
 * Input برای عنوان دلخواه باز می‌شود (طبق درخواست صریح کارفرما).
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
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-[var(--sf-ink)]">
            <MapPin className="size-4 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
            موقعیت روی نقشه
          </p>
          <button
            type="button"
            onClick={() => setShowMapPicker((v) => !v)}
            className="rounded-full bg-[var(--color-primary)]/10 px-3 py-1 text-xs font-bold text-[var(--color-primary)] active:bg-[var(--color-primary)]/20"
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

      <div className="space-y-4 rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
        <div>
          <label className="mb-2 block text-xs font-medium text-[var(--sf-ink)]/70">
            این آدرس چیست؟
          </label>
          <div className="grid grid-cols-3 gap-2">
            {ADDRESS_TYPE_OPTIONS.map(({ value, label, icon: Icon, activeClassName }) => {
              const active = values.addressType === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => update("addressType", value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border py-3 text-xs font-bold transition-colors",
                    active
                      ? activeClassName
                      : "border-black/5 bg-gray-50 text-[var(--sf-ink)]/50 active:bg-gray-100",
                  )}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>
          {values.addressType === "other" && (
            <div className="mt-3">
              <Input
                placeholder="عنوان دلخواه (مثلاً خانه مادربزرگ)"
                value={values.customTitle}
                onChange={(e) => update("customTitle", e.target.value)}
              />
              {errors.customTitle && (
                <p className="mt-1 text-xs text-danger">{errors.customTitle[0]}</p>
              )}
            </div>
          )}
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

        <label
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm font-medium transition-colors",
            values.isDefault
              ? "border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 text-[var(--color-primary)]"
              : "border-black/5 text-[var(--sf-ink)]/70",
          )}
        >
          <input
            type="checkbox"
            checked={values.isDefault}
            onChange={(e) => update("isDefault", e.target.checked)}
            className="size-4 rounded border-border accent-[var(--color-primary)]"
          />
          <Sparkles className="size-4" strokeWidth={1.75} aria-hidden="true" />
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
