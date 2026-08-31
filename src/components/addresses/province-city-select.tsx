"use client";

import { useEffect, useState } from "react";

interface LocationOption {
  id: string;
  name: string;
  code: string;
}

interface Props {
  provinceName: string;
  cityName: string;
  onChange: (values: { provinceName: string; cityName: string }) => void;
}

/**
 * انتخاب استان → سپس فقط شهرهای همان استان (بند ۳ سند Audit: «به هیچ
 * عنوان برای استان و شهر از Input آزاد استفاده نکن»). مقدار نهایی که
 * به بیرون داده می‌شود همچنان دو رشته نام (سازگار با Schema فعلی
 * `Order.shippingAddress`) است، اما فقط از یک لیست معتبر انتخاب
 * می‌شود، نه تایپ آزاد.
 *
 * شناسه استان انتخاب‌شده عمداً State جدا نیست؛ از `provinceName`
 * ورودی + فهرست دریافتی محاسبه می‌شود تا نیازی به یک Effect برای
 * هم‌گام‌سازی State نباشد (رفتار توصیه‌شده React برای مقادیر مشتق‌شده).
 */
export function ProvinceCitySelect({ provinceName, cityName, onChange }: Props) {
  const [provinces, setProvinces] = useState<LocationOption[] | null>(null);
  const [cities, setCities] = useState<LocationOption[] | null>(null);

  useEffect(() => {
    fetch("/api/v1/provinces")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setProvinces(body.data);
      })
      .catch(() => setProvinces([]));
  }, []);

  const selectedProvinceId = provinces?.find((p) => p.name === provinceName)?.id ?? "";

  useEffect(() => {
    if (!selectedProvinceId) return;
    let cancelled = false;

    fetch(`/api/v1/cities?province=${selectedProvinceId}`)
      .then((res) => res.json())
      .then((body) => {
        if (!cancelled && body.success) setCities(body.data);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedProvinceId]);

  const selectClass =
    "h-11 w-full rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm text-foreground disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/80">استان</label>
        <select
          className={selectClass}
          value={selectedProvinceId}
          onChange={(e) => {
            const id = e.target.value;
            const p = provinces?.find((pr) => pr.id === id);
            onChange({ provinceName: p?.name ?? "", cityName: "" });
          }}
        >
          <option value="">انتخاب استان</option>
          {provinces?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {provinces && provinces.length === 0 ? (
          <p className="mt-1 text-xs text-danger">
            هنوز هیچ استانی Import نشده — از تنظیمات، استان‌ها و شهرها را وارد کنید
          </p>
        ) : null}
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-foreground/80">شهر</label>
        <select
          className={selectClass}
          value={cities?.find((c) => c.name === cityName)?.id ?? ""}
          disabled={!selectedProvinceId}
          onChange={(e) => {
            const c = cities?.find((city) => city.id === e.target.value);
            onChange({ provinceName, cityName: c?.name ?? "" });
          }}
        >
          <option value="">انتخاب شهر</option>
          {cities?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
