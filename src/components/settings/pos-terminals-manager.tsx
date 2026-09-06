"use client";

import { useEffect, useState, useTransition } from "react";
import { Landmark, Pencil, Plus, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PosTerminalFormModal,
  type PosTerminalFormValues,
} from "@/components/settings/pos-terminal-form-modal";

interface ApiPosTerminal {
  id: string;
  name: string;
  bank: { id: string; name: string } | null;
  accountNumber: string;
  isActive: boolean;
}

export function PosTerminalsManager() {
  const [terminals, setTerminals] = useState<ApiPosTerminal[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PosTerminalFormValues | undefined>();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/pos-terminals");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setTerminals(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function toggleActive(terminal: ApiPosTerminal) {
    setTogglingId(terminal.id);
    try {
      const res = await fetch(`/api/v1/pos-terminals/${terminal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !terminal.isActive }),
      });
      const body = await res.json();
      if (res.ok && body.success) {
        setTerminals((prev) =>
          prev.map((t) => (t.id === terminal.id ? { ...t, isActive: !terminal.isActive } : t)),
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
          کارتخوان جدید
        </Button>
      </div>

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-12 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : terminals.length === 0 ? (
          <EmptyState
            icon={Terminal}
            title="هنوز کارتخوانی ثبت نشده"
            description="با دکمه «کارتخوان جدید» اولین کارتخوان فروشگاه را اضافه کنید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {terminals.map((terminal) => (
              <li key={terminal.id} className="flex items-center gap-3 px-5 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-primary-soft text-primary">
                  <Terminal className="size-4" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-medium text-foreground">
                    {terminal.name}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted">
                    <Landmark className="size-3" />
                    {terminal.bank?.name ?? "—"}
                  </span>
                </span>
                <Badge tone={terminal.isActive ? "success" : "neutral"}>
                  {terminal.isActive ? "فعال" : "غیرفعال"}
                </Badge>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleActive(terminal)}
                    disabled={togglingId === terminal.id}
                    className="rounded-[var(--radius-sm)] px-2 py-1 text-xs text-muted hover:bg-surface-subtle"
                  >
                    {terminal.isActive ? "غیرفعال کردن" : "فعال کردن"}
                  </button>
                  <button
                    onClick={() => {
                      setEditing({
                        id: terminal.id,
                        name: terminal.name,
                        bankId: terminal.bank?.id ?? "",
                        accountNumber: terminal.accountNumber,
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
        <PosTerminalFormModal
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
