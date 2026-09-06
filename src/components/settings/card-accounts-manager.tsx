"use client";

import { useEffect, useState, useTransition } from "react";
import { CreditCard, Landmark, Pencil, Plus, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toPersianDigits } from "@/lib/utils/format";
import {
  CardAccountFormModal,
  type CardAccountFormValues,
} from "@/components/settings/card-account-form-modal";
import { SendCardAccountModal } from "@/components/settings/send-card-account-modal";

interface ApiCardAccount {
  id: string;
  cardNumber: string;
  shabaNumber: string | null;
  bank: { id: string; name: string } | null;
  accountNumber: string;
  ownerName: string;
  isActive: boolean;
}

export function CardAccountsManager() {
  const [accounts, setAccounts] = useState<ApiCardAccount[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CardAccountFormValues | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [sendingFor, setSendingFor] = useState<ApiCardAccount | null>(null);
  const [sentMessage, setSentMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/card-accounts");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setAccounts(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function toggleActive(account: ApiCardAccount) {
    setTogglingId(account.id);
    try {
      const res = await fetch(`/api/v1/card-accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setAccounts((prev) =>
          prev.map((a) => (a.id === account.id ? { ...a, isActive: !account.isActive } : a)),
        );
      }
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => {
            setEditing(undefined);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          کارت/حساب جدید
        </Button>
      </div>

      {sentMessage ? (
        <p className="text-xs text-success">{sentMessage}</p>
      ) : null}

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-12 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : accounts.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="هنوز کارت/حسابی ثبت نشده"
            description="با دکمه «کارت/حساب جدید» اولین حساب دریافت کارت‌به‌کارت را اضافه کنید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li key={account.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                  <CreditCard className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground tabular-nums">
                    {toPersianDigits(account.cardNumber)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Landmark className="size-3" />
                    {account.bank?.name ?? "بدون بانک"} · {account.ownerName}
                  </span>
                </span>
                <Badge tone={account.isActive ? "success" : "neutral"}>
                  {account.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setSentMessage(null);
                      setSendingFor(account);
                    }}
                    aria-label="ارسال به مشتری"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                  >
                    <Send className="size-4" />
                  </button>
                  <button
                    onClick={() => toggleActive(account)}
                    disabled={togglingId === account.id}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-muted hover:bg-surface-subtle"
                  >
                    {account.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing({
                        id: account.id,
                        cardNumber: account.cardNumber,
                        shabaNumber: account.shabaNumber ?? "",
                        bankId: account.bank?.id ?? "",
                        accountNumber: account.accountNumber,
                        ownerName: account.ownerName,
                      });
                      setFormOpen(true);
                    }}
                    aria-label="ویرایش"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {formOpen ? (
        <CardAccountFormModal
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadToken((t) => t + 1);
          }}
        />
      ) : null}

      {sendingFor ? (
        <SendCardAccountModal
          cardAccountId={sendingFor.id}
          cardLabel={`${toPersianDigits(sendingFor.cardNumber)} — ${sendingFor.ownerName}`}
          onCancel={() => setSendingFor(null)}
          onSent={() => {
            setSendingFor(null);
            setSentMessage("اطلاعات کارت برای مشتری پیامک شد");
          }}
        />
      ) : null}
    </div>
  );
}
