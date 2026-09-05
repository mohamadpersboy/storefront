"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Landmark, Pencil, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { BankFormModal, type BankFormValues } from "@/components/settings/bank-form-modal";

interface ApiBank {
  id: string;
  name: string;
  logoUrl: string | null;
  isActive: boolean;
}

export function BanksManager() {
  const [banks, setBanks] = useState<ApiBank[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<BankFormValues | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/banks");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setBanks(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function toggleActive(bank: ApiBank) {
    setTogglingId(bank.id);
    try {
      const res = await fetch(`/api/v1/banks/${bank.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !bank.isActive }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setBanks((prev) =>
          prev.map((b) => (b.id === bank.id ? { ...b, isActive: !bank.isActive } : b)),
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
          بانک جدید
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-12 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : banks.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="هنوز بانکی ثبت نشده"
            description="با دکمه «بانک جدید» اولین بانک را برای ثبت چک‌ها اضافه کنید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {banks.map((bank) => (
              <li key={bank.id} className="flex items-center gap-3 px-5 py-3">
                <div className="relative size-9 shrink-0 overflow-hidden rounded-[var(--radius-md)] border border-border bg-white">
                  {bank.logoUrl ? (
                    <Image src={bank.logoUrl} alt={bank.name} fill className="object-contain p-1" />
                  ) : (
                    <Landmark className="m-auto mt-2 size-5 text-muted" />
                  )}
                </div>
                <span className="flex-1 text-sm font-medium text-foreground">{bank.name}</span>
                <Badge tone={bank.isActive ? "success" : "neutral"}>
                  {bank.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(bank)}
                    disabled={togglingId === bank.id}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-muted hover:bg-surface-subtle"
                  >
                    {bank.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing({ id: bank.id, name: bank.name, logoUrl: bank.logoUrl });
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
        <BankFormModal
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadToken((t) => t + 1);
          }}
        />
      ) : null}
    </div>
  );
}
