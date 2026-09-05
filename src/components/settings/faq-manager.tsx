"use client";

import { useEffect, useState, useTransition } from "react";
import { HelpCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FaqFormModal, type FaqFormValues } from "@/components/settings/faq-form-modal";

interface ApiFaq {
  id: string;
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
}

export function FaqManager() {
  const [faqs, setFaqs] = useState<ApiFaq[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FaqFormValues | undefined>();
  const [pendingDelete, setPendingDelete] = useState<ApiFaq | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/faqs");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setFaqs(body.data);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/v1/faqs/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setDeleteError(body.message ?? "خطا در حذف سوال متداول");
        return;
      }
      setPendingDelete(null);
      setReloadToken((t) => t + 1);
    } catch {
      setDeleteError("ارتباط با سرور برقرار نشد");
    } finally {
      setDeleting(false);
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
          سوال جدید
        </Button>
      </div>

      {deleteError ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {deleteError}
        </div>
      ) : null}

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-10 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : faqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="هنوز سوالی ثبت نشده"
            description="با دکمه «سوال جدید» اولین سوال متداول را برای نمایش در فروشگاه بسازید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {faqs.map((faq) => (
              <li key={faq.id} className="flex items-start gap-3 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{faq.question}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted">{faq.answer}</p>
                  {!faq.isActive ? (
                    <span className="mt-1 inline-block rounded-[var(--radius-sm)] bg-surface-subtle px-2 py-0.5 text-[10px] text-muted">
                      غیرفعال
                    </span>
                  ) : null}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing(faq);
                      setFormOpen(true);
                    }}
                    aria-label="ویرایش"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(faq)}
                    aria-label="حذف"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {formOpen ? (
        <FaqFormModal
          initial={editing}
          onCancel={() => setFormOpen(false)}
          onSaved={() => {
            setFormOpen(false);
            setReloadToken((t) => t + 1);
          }}
        />
      ) : null}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف سوال متداول"
        description={`آیا از حذف سوال «${pendingDelete?.question}» مطمئن هستید؟`}
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
