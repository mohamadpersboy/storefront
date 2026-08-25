"use client";

import { useState } from "react";
import { Link as LinkIcon, Copy, Check } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/orders/payment-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import type { PaymentStatus } from "@/models/Payment";

export interface PaymentPanelData {
  id: string;
  amount: number;
  status: PaymentStatus;
  refId: number | null;
  createdAt: string;
  paidAt: string | null;
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(
    new Date(iso),
  );
}

export function PaymentPanel({
  orderId,
  paymentMethod,
  prepaymentAmount,
  initialPayments,
}: {
  orderId: string;
  paymentMethod: "online" | "cash" | "split";
  prepaymentAmount: number;
  initialPayments: PaymentPanelData[];
}) {
  const [payments, setPayments] = useState(initialPayments);
  const [creating, setCreating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const paidTotal = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const remaining = prepaymentAmount - paidTotal;

  async function createPaymentLink() {
    setCreating(true);
    setError(null);
    setLink(null);
    try {
      const res = await fetch("/api/v1/payments/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "خطا در ساخت لینک پرداخت");
        return;
      }
      setLink(body.data.paymentUrl);
      if (!body.data.reused) {
        setPayments((prev) => [
          {
            id: body.data.paymentId,
            amount: body.data.amount,
            status: "pending",
            refId: null,
            createdAt: new Date().toISOString(),
            paidAt: null,
          },
          ...prev,
        ]);
      }
    } catch {
      setError("ارتباط با سرور برقرار نشد");
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied — the link is still shown as text.
    }
  }

  if (paymentMethod === "cash") {
    return null;
  }

  return (
    <Card>
      <CardHeader
        title="پرداخت آنلاین"
        description={`سهم آنلاین این سفارش ${formatToman(prepaymentAmount)} است`}
      />
      <CardContent className="flex flex-col gap-4">
        {remaining > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground/80">
              مانده قابل پرداخت آنلاین:{" "}
              <span className="font-medium text-foreground">{formatToman(remaining)}</span>
            </p>
            <Button size="sm" onClick={createPaymentLink} disabled={creating}>
              <LinkIcon className="size-4" />
              {creating ? "در حال ساخت لینک..." : "ساخت لینک پرداخت"}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-green-700">سهم آنلاین این سفارش به‌طور کامل پرداخت شده است.</p>
        )}

        {error ? <p className="text-sm text-danger">{error}</p> : null}

        {link ? (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-border-strong p-2.5">
            <span dir="ltr" className="flex-1 truncate text-xs text-foreground/80">
              {link}
            </span>
            <button
              type="button"
              onClick={copyLink}
              className="flex size-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
              aria-label="کپی لینک"
            >
              {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4" />}
            </button>
          </div>
        ) : null}

        {payments.length > 0 ? (
          <ul className="divide-y divide-border border-t border-border">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="tabular-nums font-medium text-foreground">
                    {formatToman(p.amount)}
                  </span>
                  <span className="text-xs text-muted">
                    {formatDateTime(p.createdAt)}
                    {p.refId ? ` · کد پیگیری ${toPersianDigits(p.refId)}` : ""}
                  </span>
                </div>
                <PaymentStatusBadge status={p.status} />
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
