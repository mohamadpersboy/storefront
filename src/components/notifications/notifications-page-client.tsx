"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Archive, Bell, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCard, TableCell, TableHead, TableHeaderRow, TableRow } from "@/components/ui/table";
import type { AdminNotificationDTO } from "@/lib/notifications/serialize";
import type { NotificationDisplayState, NotificationType } from "@/lib/notifications/constants";
import { formatRelativeTime } from "@/lib/notifications/relative-time";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const TYPE_LABELS: Record<NotificationType, string> = {
  announcement: "اطلاعیه",
  promotion: "تخفیف / کمپین",
  coupon: "کد تخفیف",
  special_offer: "پیشنهاد ویژه",
  order: "سفارش",
  referral: "دعوت دوستان",
  coupon_expiry: "انقضای کد",
  system: "سیستمی",
};

const STATE_BADGE: Record<NotificationDisplayState, { label: string; tone: "neutral" | "success" | "warning" | "danger" | "primary" }> = {
  draft: { label: "پیش‌نویس", tone: "neutral" },
  scheduled: { label: "زمان‌بندی‌شده", tone: "primary" },
  active: { label: "در حال نمایش", tone: "success" },
  expired: { label: "منقضی‌شده", tone: "warning" },
  archived: { label: "آرشیو", tone: "neutral" },
};

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "آرشیو" },
];
const typeOptions = [
  { value: "all", label: "همه نوع‌ها" },
  ...(["announcement", "promotion", "coupon", "special_offer", "system"] as const).map((t) => ({
    value: t,
    label: TYPE_LABELS[t],
  })),
];

type Action = { kind: "delete" | "archive"; item: AdminNotificationDTO };

export function NotificationsPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdminNotificationDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [pending, setPending] = useState<Action | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/notifications/manage?${params}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setItems(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [page, search, status, type, reloadToken]);

  async function confirmAction() {
    if (!pending) return;
    setActing(true);
    setActionError(null);
    try {
      const url = `/api/v1/notifications/manage/${pending.item.id}`;
      const res =
        pending.kind === "delete"
          ? await fetch(url, { method: "DELETE" })
          : await fetch(url, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "archived" }),
            });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setActionError(body.message ?? "خطا در انجام عملیات");
        return;
      }
      setPending(null);
      setReloadToken((t) => t + 1);
    } catch {
      setActionError("ارتباط با سرور برقرار نشد");
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input placeholder="جستجوی عنوان..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="pr-9" />
          </div>
          <div className="sm:w-44">
            <Combobox value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={statusOptions} />
          </div>
          <div className="sm:w-44">
            <Combobox value={type} onChange={(v) => { setType(v); setPage(1); }} options={typeOptions} />
          </div>
        </div>
        <Link href="/dashboard/notifications/new">
          <Button>
            <Plus className="size-4" />
            اعلان جدید
          </Button>
        </Link>
      </div>

      <TableCard className="overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : items.length === 0 ? (
          <EmptyState icon={Bell} title="اعلانی ثبت نشده" description="اعلان جدید بسازید تا برای همه بازدیدکنندگان نمایش داده شود." />
        ) : (
          <>
            <Table>
              <TableHeaderRow>
                <TableHead className="px-4 py-3">عنوان</TableHead>
                <TableHead className="px-4 py-3">نوع</TableHead>
                <TableHead className="px-4 py-3">وضعیت</TableHead>
                <TableHead className="px-4 py-3">انتشار</TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableHeaderRow>
              <TableBody>
                {items.map((n) => {
                  const badge = STATE_BADGE[n.displayState];
                  return (
                    <TableRow key={n.id} href={`/dashboard/notifications/${n.id}/edit`}>
                      <TableCell mobileVariant="title" className="px-4 py-3 font-medium text-foreground">{n.title}</TableCell>
                      <TableCell label="نوع" className="px-4 py-3 text-sm">{TYPE_LABELS[n.type]}</TableCell>
                      <TableCell label="وضعیت" className="px-4 py-3"><Badge tone={badge.tone}>{badge.label}</Badge></TableCell>
                      <TableCell label="انتشار" className="px-4 py-3 text-muted">{formatRelativeTime(n.publishAt)}</TableCell>
                      <TableCell mobileVariant="actions" className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/notifications/${n.id}/edit`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
                            aria-label="ویرایش"
                          >
                            <Pencil className="size-4" />
                          </Link>
                          {n.status === "published" ? (
                            <button
                              type="button"
                              aria-label="آرشیو"
                              onClick={(e) => { e.stopPropagation(); setPending({ kind: "archive", item: n }); }}
                              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
                            >
                              <Archive className="size-4" />
                            </button>
                          ) : null}
                          {n.status === "draft" ? (
                            <button
                              type="button"
                              aria-label="حذف"
                              onClick={(e) => { e.stopPropagation(); setPending({ kind: "delete", item: n }); }}
                              className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </TableCard>

      <ConfirmDialog
        open={pending !== null}
        title={pending?.kind === "delete" ? "حذف پیش‌نویس" : "آرشیو اعلان"}
        description={
          pending?.kind === "delete"
            ? `پیش‌نویس «${pending.item.title}» حذف شود؟`
            : `اعلان «${pending?.item.title ?? ""}» از نمایش خارج می‌شود (حذف نمی‌شود).`
        }
        confirmLabel={pending?.kind === "delete" ? "حذف" : "آرشیو"}
        confirmVariant={pending?.kind === "delete" ? "danger" : "primary"}
        loading={acting}
        extraContent={actionError ? <p className="text-sm text-danger">{actionError}</p> : undefined}
        onConfirm={confirmAction}
        onCancel={() => { setPending(null); setActionError(null); }}
      />
    </div>
  );
}
