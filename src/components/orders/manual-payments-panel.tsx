"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Banknote, CreditCard, Landmark, Plus, Terminal } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { JalaliDatePicker } from "@/components/ui/jalali-date-picker";
import { AdminPicker } from "@/components/checks/admin-picker";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { formatToman, toPersianDigits, digitsOnly } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import type { PaymentMethod, PaymentStatus } from "@/models/Payment";

export interface ManualPaymentItem {
  id: string;
  amount: number;
  walletAmount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  createdAt: string;
  posTerminal: string | null;
  cardAccount: { ownerName: string; cardNumber: string } | null;
  check: {
    id: string;
    amount: number;
    dueDate: string;
    sayadiId: string;
    status: string;
    bank: string | null;
  } | null;
}

const methodLabels: Record<string, string> = {
  zarinpal: "درگاه آنلاین",
  cash: "نقدی",
  pos: "کارتخوان",
  card_transfer: "کارت به کارت",
  check: "چک",
};

const methodIcons: Record<string, typeof Banknote> = {
  cash: Banknote,
  pos: Terminal,
  card_transfer: CreditCard,
  check: Landmark,
};

interface ApiBank {
  id: string;
  name: string;
}
interface ApiPosTerminal {
  id: string;
  name: string;
}
interface ApiCardAccount {
  id: string;
  ownerName: string;
  cardNumber: string;
}
interface ReceiverUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: string;
}
interface ApiCheckOption {
  id: string;
  amount: number;
  sayadiId: string;
  bank: { name: string } | null;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between text-foreground/80">
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}

export function ManualPaymentsPanel({
  orderId,
  totalAmount,
  paidAmount,
  remainingAmount,
}: {
  orderId: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
}) {
  const router = useRouter();
  const [payments, setPayments] = useState<ManualPaymentItem[]>([]);
  const [loading, startTransition] = useTransition();
  const [formOpen, setFormOpen] = useState(false);

  function load() {
    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/orders/${orderId}/payments`);
        const body = await res.json();
        if (body.success) setPayments(body.data);
      } catch {
        // silently ignored — panel just stays empty, order detail page still works
      }
    });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const activePayments = payments.filter((p) => p.status === "paid");
  const totalsByMethod: Record<string, number> = {};
  for (const p of activePayments) {
    totalsByMethod[p.method] = (totalsByMethod[p.method] ?? 0) + p.amount + p.walletAmount;
  }

  return (
    <Card>
      <CardHeader
        title="اطلاعات پرداخت"
        description="ثبت دستی وجوه دریافت‌شده برای این سفارش (نقدی/کارتخوان/کارت‌به‌کارت/چک)"
        action={
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="size-4" />
            ثبت دریافت وجه
          </Button>
        }
      />
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5 text-sm">
          <Row label="مبلغ کل سفارش" value={formatToman(totalAmount)} />
          {(["cash", "pos", "card_transfer", "check"] as const).map((method) =>
            totalsByMethod[method] ? (
              <Row key={method} label={methodLabels[method]} value={formatToman(totalsByMethod[method])} />
            ) : null,
          )}
          <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-medium text-foreground">
            <span>مجموع پرداخت‌شده</span>
            <span className="tabular-nums">{formatToman(paidAmount)}</span>
          </div>
          <div className="flex justify-between text-muted">
            <span>مبلغ باقی‌مانده</span>
            <span className="tabular-nums">{formatToman(remainingAmount)}</span>
          </div>
        </div>

        {loading ? null : payments.length > 0 ? (
          <ul className="divide-y divide-border border-t border-border">
            {payments.map((p) => {
              const Icon = methodIcons[p.method] ?? Banknote;
              return (
                <li key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-muted" />
                    <div className="flex flex-col gap-0.5">
                      <span className="tabular-nums font-medium text-foreground">
                        {formatToman(p.amount + p.walletAmount)}
                      </span>
                      <span className="text-xs text-muted">
                        {methodLabels[p.method]}
                        {p.method === "pos" && p.posTerminal ? ` · ${p.posTerminal}` : ""}
                        {p.method === "card_transfer" && p.cardAccount
                          ? ` · ${p.cardAccount.ownerName}`
                          : ""}
                        {p.method === "check" && p.check
                          ? ` · ${p.check.bank ?? ""} · سررسید ${formatJalali(p.check.dueDate)}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </li>
              );
            })}
          </ul>
        ) : null}
      </CardContent>

      {formOpen ? (
        <RecordPaymentModal
          orderId={orderId}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            load();
            router.refresh();
          }}
        />
      ) : null}
    </Card>
  );
}

function RecordPaymentModal({
  orderId,
  onCancel,
  onSaved,
}: {
  orderId: string;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [method, setMethod] = useState<"cash" | "pos" | "card_transfer" | "check">("cash");
  const [amountInput, setAmountInput] = useState("");

  const [posTerminals, setPosTerminals] = useState<ApiPosTerminal[]>([]);
  const [posTerminalId, setPosTerminalId] = useState("");

  const [cardAccounts, setCardAccounts] = useState<ApiCardAccount[]>([]);
  const [cardAccountId, setCardAccountId] = useState("");

  const [checkMode, setCheckMode] = useState<"existing" | "new">("existing");
  const [checkOptions, setCheckOptions] = useState<ApiCheckOption[]>([]);
  const [checkId, setCheckId] = useState("");

  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [bankId, setBankId] = useState("");
  const [issuerFirstName, setIssuerFirstName] = useState("");
  const [issuerLastName, setIssuerLastName] = useState("");
  const [issuerNationalId, setIssuerNationalId] = useState("");
  const [receiver, setReceiver] = useState<ReceiverUser | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [receivedDate, setReceivedDate] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [checkAmountInput, setCheckAmountInput] = useState("");
  const [checkSeries, setCheckSeries] = useState("");
  const [checkNumber, setCheckNumber] = useState("");
  const [sayadiId, setSayadiId] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/pos-terminals")
      .then((res) => res.json())
      .then((body) => body.success && setPosTerminals(body.data.filter((t: { isActive: boolean }) => t.isActive)));
    fetch("/api/v1/card-accounts")
      .then((res) => res.json())
      .then((body) => body.success && setCardAccounts(body.data.filter((a: { isActive: boolean }) => a.isActive)));
    fetch("/api/v1/banks")
      .then((res) => res.json())
      .then((body) => body.success && setBanks(body.data.filter((b: { isActive: boolean }) => b.isActive)));
    fetch("/api/v1/checks?status=registered&limit=50")
      .then((res) => res.json())
      .then((body) => body.success && setCheckOptions(body.data));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let payload: Record<string, unknown>;

    if (method === "cash") {
      payload = { method: "cash", amount: Number(digitsOnly(amountInput)) };
    } else if (method === "pos") {
      payload = { method: "pos", amount: Number(digitsOnly(amountInput)), posTerminalId };
    } else if (method === "card_transfer") {
      payload = { method: "card_transfer", amount: Number(digitsOnly(amountInput)), cardAccountId };
    } else if (checkMode === "existing") {
      payload = { method: "check", checkId };
    } else {
      if (!receiver || !receivedDate || !dueDate) {
        setError("همه فیلدهای چک را کامل کنید");
        return;
      }
      payload = {
        method: "check",
        newCheck: {
          bankId,
          issuer: {
            firstName: issuerFirstName,
            lastName: issuerLastName,
            nationalId: issuerNationalId,
          },
          receiverId: receiver.id,
          phoneNumber,
          receivedDate,
          dueDate,
          amount: Number(digitsOnly(checkAmountInput)),
          checkSeries,
          checkNumber,
          sayadiId,
          status: "registered",
        },
      };
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/v1/orders/${orderId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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

  const methodOptions = [
    { value: "cash", label: "نقدی" },
    { value: "pos", label: "کارتخوان" },
    { value: "card_transfer", label: "کارت به کارت" },
    { value: "check", label: "چک" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <form
        onSubmit={handleSubmit}
        className="relative my-8 w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-surface p-5"
      >
        <h2 className="mb-4 text-sm font-semibold text-foreground">ثبت دریافت وجه</h2>

        <div className="flex flex-col gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground/80">روش دریافت</label>
            <Combobox
              value={method}
              onChange={(v) => setMethod(v as typeof method)}
              options={methodOptions}
            />
          </div>

          {method !== "check" ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">مبلغ (تومان)</label>
              <Input
                dir="ltr"
                value={amountInput ? Number(digitsOnly(amountInput)).toLocaleString("en-US") : ""}
                onChange={(e) => setAmountInput(digitsOnly(e.target.value))}
                placeholder="0"
              />
            </div>
          ) : null}

          {method === "pos" ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">کارتخوان</label>
              <Combobox
                value={posTerminalId}
                onChange={setPosTerminalId}
                placeholder="انتخاب کارتخوان"
                options={posTerminals.map((t) => ({ value: t.id, label: t.name }))}
              />
            </div>
          ) : null}

          {method === "card_transfer" ? (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                کارت/حساب مقصد
              </label>
              <Combobox
                value={cardAccountId}
                onChange={setCardAccountId}
                placeholder="انتخاب کارت/حساب"
                options={cardAccounts.map((a) => ({
                  value: a.id,
                  label: `${a.ownerName} — ${toPersianDigits(a.cardNumber)}`,
                }))}
              />
            </div>
          ) : null}

          {method === "check" ? (
            <>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCheckMode("existing")}
                  className={`flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-xs ${
                    checkMode === "existing"
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted"
                  }`}
                >
                  انتخاب چک موجود
                </button>
                <button
                  type="button"
                  onClick={() => setCheckMode("new")}
                  className={`flex-1 rounded-[var(--radius-md)] border px-3 py-2 text-xs ${
                    checkMode === "new"
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border text-muted"
                  }`}
                >
                  ثبت چک جدید
                </button>
              </div>

              {checkMode === "existing" ? (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground/80">چک</label>
                  <Combobox
                    value={checkId}
                    onChange={setCheckId}
                    placeholder="انتخاب چک ثبت‌شده"
                    options={checkOptions.map((c) => ({
                      value: c.id,
                      label: `${formatToman(c.amount)} — ${c.bank?.name ?? ""} — صیادی ${toPersianDigits(c.sayadiId)}`,
                    }))}
                  />
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-dashed border-border p-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground/80">بانک</label>
                    <Combobox
                      value={bankId}
                      onChange={setBankId}
                      placeholder="انتخاب بانک"
                      options={banks.map((b) => ({ value: b.id, label: b.name }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="نام صادرکننده"
                      value={issuerFirstName}
                      onChange={(e) => setIssuerFirstName(e.target.value)}
                    />
                    <Input
                      placeholder="نام خانوادگی"
                      value={issuerLastName}
                      onChange={(e) => setIssuerLastName(e.target.value)}
                    />
                  </div>
                  <Input
                    dir="ltr"
                    placeholder="کد ملی صادرکننده"
                    value={issuerNationalId}
                    onChange={(e) => setIssuerNationalId(digitsOnly(e.target.value).slice(0, 10))}
                  />
                  <Input
                    dir="ltr"
                    placeholder="شماره تماس"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(digitsOnly(e.target.value).slice(0, 11))}
                  />
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                      دریافت‌کننده
                    </label>
                    <AdminPicker value={receiver} onChange={setReceiver} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                  </div>
                  <Input
                    dir="ltr"
                    placeholder="مبلغ (تومان)"
                    value={checkAmountInput ? Number(digitsOnly(checkAmountInput)).toLocaleString("en-US") : ""}
                    onChange={(e) => setCheckAmountInput(digitsOnly(e.target.value))}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      dir="ltr"
                      placeholder="سری چک"
                      value={checkSeries}
                      onChange={(e) => setCheckSeries(digitsOnly(e.target.value).slice(0, 6))}
                    />
                    <Input
                      dir="ltr"
                      placeholder="شناسه چک"
                      value={checkNumber}
                      onChange={(e) => setCheckNumber(digitsOnly(e.target.value).slice(0, 6))}
                    />
                  </div>
                  <Input
                    dir="ltr"
                    placeholder="شناسه صیادی (۱۶ رقم)"
                    value={sayadiId}
                    onChange={(e) => setSayadiId(digitsOnly(e.target.value).slice(0, 16))}
                  />
                </div>
              )}
            </>
          ) : null}

          {error ? <p className="text-xs text-danger">{error}</p> : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={saving}>
            انصراف
          </Button>
          <Button type="submit" size="sm" disabled={saving}>
            {saving ? "در حال ثبت..." : "ثبت پرداخت"}
          </Button>
        </div>
      </form>
    </div>
  );
}
