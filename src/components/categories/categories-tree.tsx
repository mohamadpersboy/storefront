"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  FolderTree,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toPersianDigits } from "@/lib/utils/format";

export interface ApiCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
}

export function CategoriesTree() {
  const router = useRouter();
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [error, setError] = useState(false);
  const [loading, startTransition] = useTransition();
  const [reloadToken, setReloadToken] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pendingDelete, setPendingDelete] = useState<ApiCategory | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    startTransition(async () => {
      try {
        const res = await fetch("/api/v1/categories");
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setCategories(body.data);
        setExpanded(
          new Set(
            (body.data as ApiCategory[])
              .filter((c) => !c.parentId)
              .map((c) => c.id),
          ),
        );
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const topLevel = categories.filter((c) => !c.parentId);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/categories/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setActionError(body.message ?? "خطا در حذف دسته‌بندی");
        return;
      }
      setPendingDelete(null);
      setReloadToken((t) => t + 1);
    } catch {
      setActionError("ارتباط با سرور برقرار نشد");
    } finally {
      setDeleting(false);
    }
  }

  const childCount = pendingDelete ? childrenOf(pendingDelete.id).length : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Link href="/dashboard/categories/new">
          <Button size="sm">
            <Plus className="size-4" />
            دسته‌بندی جدید
          </Button>
        </Link>
      </div>

      {actionError ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {actionError}
        </div>
      ) : null}

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-10 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : topLevel.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="هنوز دسته‌بندی‌ای ثبت نشده"
            description="با دکمه «دسته‌بندی جدید» اولین دسته را بسازید."
          />
        ) : (
          <ul className="divide-y divide-border">
            {topLevel.map((parent) => {
              const children = childrenOf(parent.id);
              const isOpen = expanded.has(parent.id);
              return (
                <li key={parent.id}>
                  <div className="flex items-center gap-2 px-5 py-3">
                    <button
                      onClick={() => toggle(parent.id)}
                      disabled={children.length === 0}
                      aria-label={isOpen ? "بستن زیردسته‌ها" : "باز کردن زیردسته‌ها"}
                      className="flex size-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:opacity-0"
                    >
                      {isOpen ? (
                        <ChevronDown className="size-4" />
                      ) : (
                        <ChevronLeft className="size-4" />
                      )}
                    </button>

                    <span className="flex-1 text-sm font-medium text-foreground">
                      {parent.name}
                    </span>

                    {!parent.isActive ? <Badge tone="danger">غیرفعال</Badge> : null}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() =>
                          router.push(`/dashboard/categories/${parent.id}/edit`)
                        }
                        aria-label="ویرایش"
                        className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setPendingDelete(parent)}
                        aria-label="حذف"
                        className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>

                  {isOpen && children.length > 0 ? (
                    <ul className="border-t border-dashed border-border bg-surface-subtle/50">
                      {children.map((child) => (
                        <li
                          key={child.id}
                          className="flex items-center gap-2 border-b border-dashed border-border py-2.5 pl-5 pr-14 last:border-0"
                        >
                          <span className="flex-1 text-sm text-foreground/80">
                            {child.name}
                          </span>
                          {!child.isActive ? (
                            <Badge tone="danger">غیرفعال</Badge>
                          ) : null}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                router.push(
                                  `/dashboard/categories/${child.id}/edit`,
                                )
                              }
                              aria-label="ویرایش"
                              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                            >
                              <Pencil className="size-4" />
                            </button>
                            <button
                              onClick={() => setPendingDelete(child)}
                              aria-label="حذف"
                              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف دسته‌بندی"
        description={
          childCount > 0
            ? `«${pendingDelete?.name}» و ${toPersianDigits(childCount)} زیردسته آن حذف می‌شوند. این عملیات قابل بازگشت نیست.`
            : `آیا از حذف «${pendingDelete?.name}» مطمئن هستید؟ این عملیات قابل بازگشت نیست.`
        }
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
