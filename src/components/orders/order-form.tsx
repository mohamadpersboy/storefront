"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserCheck } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import {
  OrderItemsPicker,
  type OrderLineItem,
} from "@/components/orders/order-items-picker";
import { ProvinceCitySelect } from "@/components/addresses/province-city-select";
import { NeshanMapPicker } from "@/components/maps/neshan-map-picker";
import { formatToman } from "@/lib/utils/format";
import { computePrepayment, type PaymentMethod } from "@/lib/utils/pricing";

interface AppliedCoupon {
  code: string;
  discountPercentage: number;
  discountAmount: number;
}

interface ResolvedCustomer {
  id: string;
  phoneNumber: string;
  fullName: string | null;
}

const paymentOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "online", label: "پرداخت کامل آنلاین" },
  { value: "cash", label: "پرداخت کامل در محل" },
  { value: "split", label: "پرداخت ترکیبی (پیش‌پرداخت + باقی‌مانده)" },
];

export function OrderForm() {
  const router = useRouter();

  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [resolvedCustomer, setResolvedCustomer] = useState<ResolvedCustomer | null>(null);
  const [resolvingCustomer, setResolvingCustomer] = useState(false);

  const [items, setItems] = useState<OrderLineItem[]>([]);

  const [recipientName, setRecipientName] = useState("");
  const [addressPhone, setAddressPhone] = useState("");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [showMapPicker, setShowMapPicker] = useState(false);

  const [shippingCost, setShippingCost] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [splitPercent, setSplitPercent] = useState("50");
  const [notes, setNotes] = useState("");

  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function resolveCustomer() {
    setError(null);
    if (!/^09\d{9}$/.test(customerPhone)) {
      setError("شماره موبایل مشتری معتبر نیست");
      return;
    }
    setResolvingCustomer(true);
    try {
      const res = await fetch("/api/v1/customers/find-or-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: customerPhone,
          fullName: customerName || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در یافتن/ساخت مشتری");
        return;
      }
      setResolvedCustomer(body.data);
      if (!addressPhone) setAddressPhone(customerPhone);
      if (!recipientName && body.data.fullName) setRecipientName(body.data.fullName);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setResolvingCustomer(false);
    }
  }

  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const totalAmount = Math.max(0, subtotal + (Number(shippingCost) || 0) - discountAmount);
  const prepayment = computePrepayment(
    paymentMethod,
    totalAmount,
    Number(splitPercent) || 0,
  );

  async function applyCoupon() {
    setCouponError(null);
    if (!resolvedCustomer) {
      setCouponError("ابتدا مشتری را مشخص کنید");
      return;
    }
    if (!couponCodeInput.trim()) return;

    setCheckingCoupon(true);
    try {
      const res = await fetch("/api/v1/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCodeInput.trim(),
          customerId: resolvedCustomer.id,
          eligibleAmount: subtotal,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setCouponError(body.message ?? "کد تخفیف معتبر نیست");
        return;
      }
      setAppliedCoupon(body.data);
    } catch {
      setCouponError("ارتباط با سرور برقرار نشد");
    } finally {
      setCheckingCoupon(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    setCouponError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!resolvedCustomer) {
      setError("ابتدا مشتری را مشخص کنید");
      return;
    }
    if (items.length === 0) {
      setError("حداقل یک قلم به سفارش اضافه کنید");
      return;
    }
    if (!recipientName || !addressPhone || !province || !city || !addressLine || !postalCode) {
      setError("همه فیلدهای آدرس ارسال الزامی است");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: resolvedCustomer.id,
          items: items.map((i) => ({
            productId: i.productId,
            variantId: i.variantId,
            quantity: i.quantity,
          })),
          shippingAddress: {
            recipientName,
            phoneNumber: addressPhone,
            province,
            city,
            addressLine,
            postalCode,
            ...(latitude !== undefined && longitude !== undefined
              ? { latitude, longitude }
              : {}),
          },
          shippingCost: Number(shippingCost) || 0,
          paymentMethod,
          prepaymentPercent:
            paymentMethod === "split" ? Number(splitPercent) || 0 : undefined,
          couponCode: appliedCoupon?.code,
          notes,
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        return;
      }

      router.push("/dashboard/orders");
      router.refresh();
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card>
        <CardHeader title="مشتری" description="با شماره موبایل جستجو یا ثبت کنید" />
        <CardContent className="flex flex-col gap-3">
          {resolvedCustomer ? (
            <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-green-200 bg-green-50 px-4 py-3">
              <span className="flex items-center gap-2 text-sm text-green-800">
                <UserCheck className="size-4" />
                {resolvedCustomer.fullName ?? "بدون نام"} — {resolvedCustomer.phoneNumber}
              </span>
              <button
                type="button"
                onClick={() => setResolvedCustomer(null)}
                className="text-xs text-green-800 underline"
              >
                تغییر
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  شماره موبایل
                </label>
                <Input
                  dir="ltr"
                  value={customerPhone}
                  onChange={(e) =>
                    setCustomerPhone(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="09xxxxxxxxx"
                  maxLength={11}
                />
              </div>
              <div className="flex-1">
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  نام (اختیاری، اگر مشتری جدید است)
                </label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={resolveCustomer}
                disabled={resolvingCustomer}
              >
                {resolvingCustomer ? "در حال بررسی..." : "تأیید مشتری"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="اقلام سفارش" />
        <CardContent>
          <OrderItemsPicker items={items} onChange={setItems} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="آدرس ارسال"
          action={
            <button
              type="button"
              onClick={() => setShowMapPicker((v) => !v)}
              className="text-xs text-primary underline"
            >
              {showMapPicker ? "بستن نقشه" : "انتخاب روی نقشه"}
            </button>
          }
        />
        <CardContent className="flex flex-col gap-4">
          {showMapPicker ? (
            <NeshanMapPicker
              initialLatitude={latitude}
              initialLongitude={longitude}
              onConfirm={(result) => {
                setLatitude(result.latitude);
                setLongitude(result.longitude);
                if (result.province) setProvince(result.province);
                if (result.city) setCity(result.city);
                if (result.addressLine) setAddressLine(result.addressLine);
                setShowMapPicker(false);
              }}
            />
          ) : null}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                نام گیرنده
              </label>
              <Input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                شماره موبایل گیرنده
              </label>
              <Input
                dir="ltr"
                value={addressPhone}
                onChange={(e) => setAddressPhone(e.target.value.replace(/[^\d]/g, ""))}
                maxLength={11}
              />
            </div>
            <ProvinceCitySelect
              provinceName={province}
              cityName={city}
              onChange={({ provinceName, cityName }) => {
                setProvince(provinceName);
                setCity(cityName);
              }}
            />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                آدرس کامل
              </label>
              <Textarea
                rows={2}
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                کد پستی
              </label>
              <Input
                dir="ltr"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="ارسال و پرداخت" />
        <CardContent className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              هزینه ارسال (تومان)
            </label>
            <Input
              type="number"
              min={0}
              dir="ltr"
              value={shippingCost}
              onChange={(e) => setShippingCost(e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              روش پرداخت
            </label>
            <Combobox
              value={paymentMethod}
              onChange={(v) => setPaymentMethod(v as PaymentMethod)}
              options={paymentOptions}
            />
          </div>

          {paymentMethod === "split" ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                درصد پیش‌پرداخت آنلاین
              </label>
              <Input
                type="number"
                min={0}
                max={100}
                dir="ltr"
                value={splitPercent}
                onChange={(e) => setSplitPercent(e.target.value)}
              />
            </div>
          ) : null}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              کد تخفیف (اختیاری)
            </label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-green-200 bg-green-50 px-4 py-2.5">
                <span className="text-sm text-green-800" dir="ltr">
                  {appliedCoupon.code} — {appliedCoupon.discountPercentage}٪
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-xs text-green-800 underline"
                >
                  حذف
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  dir="ltr"
                  value={couponCodeInput}
                  onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                  placeholder="WELCOME10"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={applyCoupon}
                  disabled={checkingCoupon}
                >
                  {checkingCoupon ? "در حال بررسی..." : "اعمال"}
                </Button>
              </div>
            )}
            {couponError ? <p className="mt-1.5 text-xs text-danger">{couponError}</p> : null}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              یادداشت (اختیاری)
            </label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
            <div className="flex justify-between text-muted">
              <span>جمع اقلام</span>
              <span className="tabular-nums">{formatToman(subtotal)}</span>
            </div>
            {appliedCoupon ? (
              <div className="flex justify-between text-green-700">
                <span>تخفیف کد {appliedCoupon.code}</span>
                <span className="tabular-nums">−{formatToman(appliedCoupon.discountAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted">
              <span>هزینه ارسال</span>
              <span className="tabular-nums">{formatToman(Number(shippingCost) || 0)}</span>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <span>مبلغ کل</span>
              <span className="tabular-nums">{formatToman(totalAmount)}</span>
            </div>
            {paymentMethod !== "cash" ? (
              <div className="flex justify-between text-primary">
                <span>پیش‌پرداخت آنلاین</span>
                <span className="tabular-nums">{formatToman(prepayment.prepaymentAmount)}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-muted">
              <span>باقی‌مانده (در محل)</span>
              <span className="tabular-nums">{formatToman(prepayment.remainingAmount)}</span>
            </div>
            {!appliedCoupon ? (
              <p className="pt-1 text-xs text-muted">
                در صورت فعال بودن پاداش خودکار پرداخت برای این روش، تخفیف پس از ثبت سفارش
                به‌صورت خودکار در جمع کل اعمال می‌شود.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.push("/dashboard/orders")}
        >
          انصراف
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ثبت..." : "ثبت سفارش"}
        </Button>
      </div>
    </form>
  );
}
