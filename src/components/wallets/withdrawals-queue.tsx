"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatToman } from "@/lib/utils/format";

interface Withdrawal {
  id: string;
  user: { id: string; fullName: string | null; phoneNumber: string };
  amount: number;
  destination: { ownerName: string; cardNumber: string | null; iban: string | null };
  status: "pending" | "approved_paid" | "rejected";
  reviewNote: string | null;
  createdAt: string;
}

const STATUS_LABEL: Record<Withdrawal["status"], string> = {
  pending: "در انتظار بررسی",
  approved_paid: "پرداخت‌شده",
  rejected: "رد شده",
};

export function WithdrawalsQueue() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"pending" | "all">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  function load() {
    const query = filter === "pending" ? "?status=pending" : "";
    fetch(`/api/v1/wallets/withdrawals${query}`)
      .then((res) => res.json())
      .then((body) => {
        if (body.success) setWithdrawals(body.data);
        else setError(body.message ?? "خطا در دریافت درخواست‌ها");
      })
      .catch(() => setError("ارتباط با سرور برقرار نشد"));
  }

  useEffect(load, [filter]);

  async function handleReview(id: string, action: "approve" | "reject") {
    if (action === "reject" && !confirm("از رد این درخواست مطمئن هستید؟ مبلغ به کیف پول مشتری برمی‌گردد.")) {
      return;
    }
    if (action === "approve" && !confirm("آیا واریز واقعی به کارت/شبا را از قبل انجام داده‌اید؟")) {
      return;
    }

    setProcessingId(id);
    try {
      const res = await fetch(`/api/v1/wallets/withdrawals/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        alert(body.message ?? "خطا در ثبت بررسی");
        return;
      }
      load();
    } catch {
      alert("ارتباط با سرور برقرار نشد");
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={filter === "pending" ? "primary" : "secondary"}
          onClick={() => setFilter("pending")}
        >
          در انتظار بررسی
        </Button>
        <Button
          type="button"
          size="sm"
          variant={filter === "all" ? "primary" : "secondary"}
          onClick={() => setFilter("all")}
        >
          همه
        </Button>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {!withdrawals && !error ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : null}

      {withdrawals && withdrawals.length === 0 ? (
        <p className="text-sm text-muted">درخواستی یافت نشد.</p>
      ) : null}

      {withdrawals?.map((w) => (
        <Card key={w.id}>
          <CardContent className="flex flex-col gap-2 p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                {w.user.fullName ?? w.user.phoneNumber}
              </span>
              <span dir="ltr" className="text-xs text-muted">
                {w.user.phoneNumber}
              </span>
            </div>
            <p className="text-lg font-semibold text-foreground">{formatToman(w.amount)}</p>
            <div className="text-sm text-muted">
              <p>صاحب حساب: {w.destination.ownerName}</p>
              {w.destination.cardNumber ? (
                <p dir="ltr">کارت: {w.destination.cardNumber}</p>
              ) : null}
              {w.destination.iban ? <p dir="ltr">شبا: {w.destination.iban}</p> : null}
            </div>
            <p className="text-xs text-muted">
              وضعیت: {STATUS_LABEL[w.status]}
              {w.reviewNote ? ` — ${w.reviewNote}` : ""}
            </p>

            {w.status === "pending" ? (
              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={processingId === w.id}
                  onClick={() => handleReview(w.id, "approve")}
                >
                  تأیید (واریز انجام شد)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={processingId === w.id}
                  onClick={() => handleReview(w.id, "reject")}
                >
                  رد درخواست
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
