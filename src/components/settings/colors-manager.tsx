"use client";

import { useEffect, useState, useTransition } from "react";
import { Palette, Pencil, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  ColorFormModal,
  type ColorFormValues,
} from "@/components/settings/color-form-modal";

interface ApiColor {
  id: string;
  name: string;
  hexCode: string;
  isActive: boolean;
}

export function ColorsManager() {
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ColorFormValues | undefined>();
  const [pendingDelete, setPendingDelete] = useState<ApiColor | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/colors");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setColors(body.data);
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
      const res = await fetch(`/api/v1/colors/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setDeleteError(body.message ?? "خطا در حذف رنگ");
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
          رنگ جدید
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
        ) : colors.length === 0 ? (
          <EmptyState
            icon={Palette}
            title="هنوز رنگی ثبت نشده"
            description="با دکمه «رنگ جدید» اولین رنگ را برای استفاده در Variantهای محصول بسازید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {colors.map((color) => (
              <li
                key={color.id}
                className="flex items-center gap-3 px-5 py-3"
              >
                <span
                  className="size-6 shrink-0 rounded-full border border-black/10"
                  style={{ backgroundColor: color.hexCode }}
                />
                <span className="flex-1 text-sm font-medium text-foreground">
                  {color.name}
                </span>
                <span dir="ltr" className="text-xs text-muted">
                  {color.hexCode}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditing({
                        id: color.id,
                        name: color.name,
                        hexCode: color.hexCode,
                      });
                      setFormOpen(true);
                    }}
                    aria-label="ویرایش"
                    className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => setPendingDelete(color)}
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
        <ColorFormModal
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
        title="حذف رنگ"
        description={`آیا از حذف رنگ «${pendingDelete?.name}» مطمئن هستید؟`}
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
