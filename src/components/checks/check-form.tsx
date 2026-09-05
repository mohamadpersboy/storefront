"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { AdminPicker } from "@/components/checks/admin-picker";
import { toPersianDigits } from "@/lib/utils/format";
import { numberToPersianWords } from "@/lib/utils/number-to-words";

interface ApiBank {
  id: string;
  name: string;
  isActive: boolean;
}

interface ReceiverUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: string;
}

function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, "");
}

export function CheckForm() {
  const router = useRouter();

  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [bankId, setBankId] = useState("");

  const [issuerFirstName, setIssuerFirstName] = useState("");
  const [issuerLastName, setIssuerLastName] = useState("");
  const [issuerNationalId, setIssuerNationalId] = useState("");

  const [receiver, setReceiver] = useState<ReceiverUser | null>(null);

  const [hasGuarantor, setHasGuarantor] = useState(false);
  const [guarantorFirstName, setGuarantorFirstName] = useState("");
  const [guarantorLastName, setGuarantorLastName] = useState("");
  const [guarantorNationalId, setGuarantorNationalId] = useState("");

  const [phoneNumber, setPhoneNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const [checkSeries, setCheckSeries] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [sayadiId, setSayadiId] = useState("");
  const [status, setStatus] = useState<"registered" | "not_registered">("registered");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  useEffect(() => {
    fetch("/api/v1/banks")
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setBanks(body.data.filter((b: ApiBank) => b.isActive));
      })
      .catch(() => setBanks([]));
  }, []);

  const amount = Number(digitsOnly(amountInput));
  const amountWords = amount > 0 ? numberToPersianWords(amount) : "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!receiver) {
      setError("دریافت‌کننده را انتخاب کنید");
      return;
    }
    if (!receivedDate || !dueDate) {
      setError("تاریخ دریافت و سررسید را وارد کنید");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/v1/checks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankId,
          issuer: {
            firstName: issuerFirstName,
            lastName: issuerLastName,
            nationalId: issuerNationalId,
          },
          receiverId: receiver.id,
          guarantor: hasGuarantor
            ? {
                firstName: guarantorFirstName,
                lastName: guarantorLastName,
                nationalId: guarantorNationalId || undefined,
              }
            : undefined,
          phoneNumber,
          receivedDate,
          dueDate,
          amount,
          checkSeries,
          checkNumber,
          sayadiId,
          status,
        }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        setError(body.message ?? "خطایی رخ داد");
        setFieldErrors(body.errors ?? {});
        return;
      }

      router.push(`/dashboard/checks/${body.data.id}`);
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setSaving(false);
    }
  }

  const bankOptions = banks.map((b) => ({ value: b.id, label: b.name }));
  const statusOptions = [
    { value: "registered", label: "ثبت شده" },
    { value: "not_registered", label: "ثبت نشده" },
  ];

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-foreground">اطلاعات بانک و صادرکننده</h2>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">بانک</label>
          <Combobox
            value={bankId}
            onChange={setBankId}
            options={bankOptions}
            placeholder="انتخاب بانک"
          />
          {fieldErrors.bankId ? (
            <p className="mt-1 text-xs text-danger">{fieldErrors.bankId[0]}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام صادرکننده
            </label>
            <Input value={issuerFirstName} onChange={(e) => setIssuerFirstName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              نام خانوادگی صادرکننده
            </label>
            <Input value={issuerLastName} onChange={(e) => setIssuerLastName(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            کد ملی صادرکننده
          </label>
          <Input
            dir="ltr"
            value={issuerNationalId}
            onChange={(e) => setIssuerNationalId(digitsOnly(e.target.value).slice(0, 10))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            شماره تماس
          </label>
          <Input
            dir="ltr"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(digitsOnly(e.target.value).slice(0, 11))}
            placeholder="09xxxxxxxxx"
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-foreground">دریافت‌کننده</h2>
        <AdminPicker value={receiver} onChange={setReceiver} />
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">ضامن (اختیاری)</h2>
          <button
            type="button"
            onClick={() => setHasGuarantor((v) => !v)}
            className="text-xs text-primary"
          >
            {hasGuarantor ? "حذف ضامن" : "افزودن ضامن"}
          </button>
        </div>
        {hasGuarantor ? (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  نام ضامن
                </label>
                <Input
                  value={guarantorFirstName}
                  onChange={(e) => setGuarantorFirstName(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                  نام خانوادگی ضامن
                </label>
                <Input
                  value={guarantorLastName}
                  onChange={(e) => setGuarantorLastName(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                کد ملی ضامن (اختیاری)
              </label>
              <Input
                dir="ltr"
                value={guarantorNationalId}
                onChange={(e) =>
                  setGuarantorNationalId(digitsOnly(e.target.value).slice(0, 10))
                }
              />
            </div>
          </>
        ) : null}
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-foreground">تاریخ و مبلغ</h2>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            تاریخ دریافت
          </label>
          <JalaliDatePicker value={receivedDate} onChange={setReceivedDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            تاریخ سررسید
          </label>
          <JalaliDatePicker value={dueDate} onChange={setDueDate} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">مبلغ (تومان)</label>
          <Input
            dir="ltr"
            value={amountInput ? toPersianDigits(Number(digitsOnly(amountInput)).toLocaleString("en-US")) : ""}
            onChange={(e) => setAmountInput(digitsOnly(e.target.value))}
            placeholder="۰"
          />
          {amountWords ? (
            <p className="mt-1 text-xs text-muted">{amountWords} تومان</p>
          ) : null}
          {fieldErrors.amount ? (
            <p className="mt-1 text-xs text-danger">{fieldErrors.amount[0]}</p>
          ) : null}
        </div>
      </Card>

      <Card className="flex flex-col gap-4 p-5">
        <h2 className="text-sm font-semibold text-foreground">شناسه‌های چک</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              سری چک (حداکثر ۶ رقم)
            </label>
            <Input
              dir="ltr"
              value={checkSeries}
              onChange={(e) => setCheckSeries(digitsOnly(e.target.value).slice(0, 6))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">
              شناسه چک (حداکثر ۶ رقم)
            </label>
            <Input
              dir="ltr"
              value={checkNumber}
              onChange={(e) => setCheckNumber(digitsOnly(e.target.value).slice(0, 6))}
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">
            شناسه صیادی (۱۶ رقم)
          </label>
          <Input
            dir="ltr"
            value={sayadiId}
            onChange={(e) => setSayadiId(digitsOnly(e.target.value).slice(0, 16))}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-foreground/80">وضعیت</label>
          <Combobox
            value={status}
            onChange={(v) => setStatus(v as "registered" | "not_registered")}
            options={statusOptions}
          />
        </div>
      </Card>

      {error ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? "در حال ثبت..." : "ثبت چک"}
        </Button>
      </div>
    </form>
  );
}
