"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToman } from "@/lib/utils/format";

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  balanceAfter: number;
  reason: string;
  performedBy: { fullName: string | null; phoneNumber: string } | null;
  createdAt: string;
}

interface Props {
  userId: string;
}

export function WalletManager({ userId }: Props) {
  const [balance, setBalance] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  function load() {
    fetch(`/api/v1/wallets/${userId}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.success) {
          setBalance(body.data.balance);
          setTransactions(body.data.transactions);
        } else {
          setLoadError(body.message ?? "خطا در دریافت کیف پول");
        }
      })
      .catch(() => setLoadError("ارتباط با سرور برقرار نشد"));
  }

  useEffect(load, [userId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      setFormError("مبلغ باید بزرگ‌تر از صفر باشد");
      return;
    }
    if (reason.trim().length < 3) {
      setFormError("دلیل تعدیل الزامی است");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/wallets/${userId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: numericAmount, reason: reason.trim() }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setFormError(body.message ?? "خطا در ثبت تعدیل");
        return;
      }
      setAmount("");
      setReason("");
      load();
    } catch {
      setFormError("ارتباط با سرور برقرار نشد");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader title="کیف پول" description="تعدیل دستی موجودی — بدون درگاه پرداخت" />
      <CardContent className="flex flex-col gap-4">
        {loadError ? <p className="text-sm text-danger">{loadError}</p> : null}
        {balance === null && !loadError ? <Skeleton className="h-8 w-40" /> : null}
        {balance !== null ? (
          <p className="text-lg font-semibold text-foreground">
            موجودی فعلی: <span dir="ltr">{formatToman(balance)}</span>
          </p>
        ) : null}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <select
            className="h-11 rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value as "credit" | "debit")}
          >
            <option value="credit">افزایش موجودی</option>
            <option value="debit">کاهش موجودی</option>
          </select>
          <Input
            dir="ltr"
            placeholder="مبلغ (تومان)"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
          />
          <Input
            placeholder="دلیل تعدیل"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="sm:col-span-1"
          />
          <Button type="submit" disabled={submitting}>
            {submitting ? "در حال ثبت..." : "ثبت تعدیل"}
          </Button>
        </form>
        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium text-foreground">تراکنش‌های اخیر</p>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted">هنوز تراکنشی ثبت نشده است.</p>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex flex-col">
                    <span className="text-foreground">{t.reason}</span>
                    <span className="text-xs text-muted">
                      {t.performedBy?.fullName ?? t.performedBy?.phoneNumber ?? "—"} ·{" "}
                      {new Intl.DateTimeFormat("fa-IR").format(new Date(t.createdAt))}
                    </span>
                  </div>
                  <span
                    dir="ltr"
                    className={t.type === "credit" ? "text-green-700" : "text-danger"}
                  >
                    {t.type === "credit" ? "+" : "-"}
                    {formatToman(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
