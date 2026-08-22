"use client";

import { useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toPersianDigits } from "@/lib/utils/format";
import { initialMockCategories, type MockCategory } from "@/lib/mock/categories";

export function CategoriesTree() {
  const router = useRouter();
  const [categories, setCategories] = useState(initialMockCategories);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(initialMockCategories.filter((c) => !c.parentId).map((c) => c.id)),
  );
  const [pendingDelete, setPendingDelete] = useState<MockCategory | null>(null);

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

  function handleDelete() {
    if (!pendingDelete) return;
    setCategories((prev) =>
      prev.filter(
        (c) => c.id !== pendingDelete.id && c.parentId !== pendingDelete.id,
      ),
    );
    setPendingDelete(null);
  }

  const childCount = pendingDelete
    ? childrenOf(pendingDelete.id).length
    : 0;

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        داده‌های این صفحه نمایشی (Mock) هستند. افزودن/ویرایش/حذف در همین
        صفحه شبیه‌سازی می‌شود ولی با رفرش صفحه از بین می‌رود — در فاز
        Backend به دیتابیس واقعی وصل می‌شود.
      </div>

      <div className="flex justify-end">
        <Link href="/dashboard/categories/new">
          <Button size="sm">
            <Plus className="size-4" />
            دسته‌بندی جدید
          </Button>
        </Link>
      </div>

      <Card>
        {topLevel.length === 0 ? (
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
                    <span className="text-xs text-muted">
                      {toPersianDigits(parent.productsCount)} محصول
                    </span>

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
                          <span className="text-xs text-muted">
                            {toPersianDigits(child.productsCount)} محصول
                          </span>
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
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
