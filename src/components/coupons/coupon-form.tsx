"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { CouponCodeGenerator, useSuggestCouponCode } from "@/components/coupons/coupon-code-generator";

interface AllowedUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
}

export interface CouponFormInitial {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  startsAt: string | null;
  expiresAt: string;
  status: "active" | "inactive";
  type: "public" | "private";
  allowedUsers: AllowedUser[];
  usageLimit: number | null;
  perUserLimit: number | null;
}


export function CouponForm({ initial }: { initial?: CouponFormInitial }) {
  const router = useRouter();
  const mode = initial ? "edit" : "create";

  const [code, setCode] = useState(initial?.code ?? "");
  const { suggest: suggestInitialCode } = useSuggestCouponCode();

  // Prefill a suggested code on a brand-new coupon so the field is
  // never blank — the person can still edit it or click "پیشنهاد
  // کد تخفیف" for a different one.
  useEffect(() => {
    if (mode === "create") {
      suggestInitialCode().then(setCode);
    }
  }, [mode, suggestInitialCode]);
  const [discountPercentage, setDiscountPercentage] = useState(
    String(initial?.discountPercentage ?? "10"),
  );
  const [hasMaxDiscount, setHasMaxDiscount] = useState(initial?.maxDiscountAmount != null);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState(
    initial?.maxDiscountAmount != null ? String(initial.maxDiscountAmount) : "",
  );
  const [minOrderAmount, setMinOrderAmount] = useState(String(initial?.minOrderAmount ?? "0"));
  const [startsAt, setStartsAt] = useState<string | null>(initial?.startsAt ?? null);
  const [expiresAt, setExpiresAt] = useState<string | null>(initial?.expiresAt ?? null);
  const [status, setStatus] = useState<"active" | "inactive">(initial?.status ?? "active");
  const [type, setType] = useState<"public" | "private">(initial?.type ?? "public");
  const [allowedUsers, setAllowedUsers] = useState<AllowedUser[]>(initial?.allowedUsers ?? []);
  const [hasUsageLimit, setHasUsageLimit] = useState(initial?.usageLimit != null);
  const [usageLimit, setUsageLimit] = useState(
    initial?.usageLimit != null ? String(initial.usageLimit) : "100",
  );
  const [hasPerUserLimit, setHasPerUserLimit] = useState(initial?.perUserLimit != null);
  const [perUserLimit, setPerUserLimit] = useState(
    initial?.perUserLimit != null ? String(initial.perUserLimit) : "1",
  );

  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<AllowedUser[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userQuery.trim()) {
      const timeout = setTimeout(() => setUserResults([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      fetch(`/api/v1/customers?search=${encodeURIComponent(userQuery)}&limit=5`)
        .then((res) => res.json())
        .then((body) => {
          if (body.success) {
            setUserResults(
              body.data.map((c: { id: string; fullName: string | null; phoneNumber: string }) => ({
                id: c.id,
                fullName: c.fullName,
                phoneNumber: c.phoneNumber,
              })),
            );
          }
        })
        .catch(() => setUserResults([]));
    }, 350);
    return () => clearTimeout(timeout);
  }, [userQuery]);

  function addUser(user: AllowedUser) {
    if (!allowedUsers.some((u) => u.id === user.id)) {
      setAllowedUsers((prev) => [...prev, user]);
    }
    setUserQuery("");
    setUserResults([]);
  }

  function removeUser(id: string) {
    setAllowedUsers((prev) => prev.filter((u) => u.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (type === "private" && allowedUsers.length === 0) {
      setError("برای کد تخفیف خصوصی باید حداقل یک کاربر انتخاب شود");
      return;
    }
    if (!expiresAt) {
      setError("تاریخ انقضا الزامی است");
      return;
    }
    if (startsAt && new Date(startsAt).getTime() >= new Date(expiresAt).getTime()) {
      setError("تاریخ شروع باید قبل از تاریخ انقضا باشد");
      return;
    }

    const body = {
      code,
      discountPercentage: Number(discountPercentage) || 0,
      maxDiscountAmount: hasMaxDiscount ? Number(maxDiscountAmount) || 0 : null,
      minOrderAmount: Number(minOrderAmount) || 0,
      startsAt,
      expiresAt,
      status,
      type,
      allowedUserIds: type === "private" ? allowedUsers.map((u) => u.id) : [],
      usageLimit: hasUsageLimit ? Number(usageLimit) || 1 : null,
      perUserLimit: hasPerUserLimit ? Number(perUserLimit) || 1 : null,
    };

    setSaving(true);
    try {
      const res = await fetch(
        mode === "create" ? "/api/v1/coupons" : `/api/v1/coupons/${initial!.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const resBody = await res.json();
      if (!res.ok || !resBody.success) {
        setError(resBody.message ?? "خطا در ثبت کد تخفیف");
        return;
      }
      router.push("/dashboard/coupons");
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
        <CardHeader title="اطلاعات پایه" />
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">کد تخفیف</label>
              <Input
                dir="ltr"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="WELCOME10"
                required
              />
              <CouponCodeGenerator
                discountPercentage={Number(discountPercentage) || 0}
                onGenerate={setCode}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">وضعیت</label>
              <Combobox
                value={status}
                onChange={(v) => setStatus(v as "active" | "inactive")}
                options={[
                  { value: "active", label: "فعال" },
                  { value: "inactive", label: "غیرفعال" },
                ]}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">درصد تخفیف</label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                max={100}
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">حداقل مبلغ سفارش (تومان)</label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">تاریخ شروع (اختیاری)</label>
              <JalaliDatePicker value={startsAt} onChange={setStartsAt} allowEmpty />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs text-muted">تاریخ انقضا</label>
              <JalaliDatePicker value={expiresAt} onChange={setExpiresAt} />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={hasMaxDiscount}
                  onChange={(e) => setHasMaxDiscount(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                سقف مبلغ تخفیف
              </label>
              <Input
                type="number"
                dir="ltr"
                min={0}
                disabled={!hasMaxDiscount}
                value={maxDiscountAmount}
                onChange={(e) => setMaxDiscountAmount(e.target.value)}
                placeholder="بدون سقف"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={hasUsageLimit}
                  onChange={(e) => setHasUsageLimit(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                محدودیت تعداد کل استفاده
              </label>
              <Input
                type="number"
                dir="ltr"
                min={1}
                disabled={!hasUsageLimit}
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="نامحدود"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={hasPerUserLimit}
                  onChange={(e) => setHasPerUserLimit(e.target.checked)}
                  className="size-4 rounded border-border"
                />
                محدودیت استفاده هر کاربر
              </label>
              <Input
                type="number"
                dir="ltr"
                min={1}
                disabled={!hasPerUserLimit}
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                placeholder="نامحدود"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="دسترسی"
          description="کد عمومی برای همه مشتریان، یا خصوصی فقط برای مشتریان انتخاب‌شده"
        />
        <CardContent className="flex flex-col gap-3">
          <Combobox
            value={type}
            onChange={(v) => setType(v as "public" | "private")}
            options={[
              { value: "public", label: "عمومی" },
              { value: "private", label: "خصوصی" },
            ]}
          />

          {type === "private" ? (
            <div className="flex flex-col gap-3">
              <div className="relative">
                <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <Input
                  value={userQuery}
                  onChange={(e) => setUserQuery(e.target.value)}
                  placeholder="جستجوی مشتری با نام یا شماره موبایل..."
                  className="pr-9"
                />
                {userResults.length > 0 ? (
                  <ul className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-lg">
                    {userResults.map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          onClick={() => addUser(u)}
                          className="flex w-full items-center justify-between px-3 py-2.5 text-right text-sm hover:bg-surface-subtle"
                        >
                          <span>{u.fullName ?? "بدون نام"}</span>
                          <span className="text-muted" dir="ltr">
                            {u.phoneNumber}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              {allowedUsers.length > 0 ? (
                <ul className="flex flex-col gap-1.5">
                  {allowedUsers.map((u) => (
                    <li
                      key={u.id}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border px-3 py-2 text-sm"
                    >
                      <span>
                        {u.fullName ?? "بدون نام"}{" "}
                        <span className="text-muted" dir="ltr">
                          {u.phoneNumber}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => removeUser(u.id)}
                        className="text-muted hover:text-danger"
                        aria-label="حذف"
                      >
                        <X className="size-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted">هنوز کاربری انتخاب نشده</p>
              )}
            </div>
          ) : null}

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ثبت..." : mode === "create" ? "ثبت کد تخفیف" : "ذخیره تغییرات"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
