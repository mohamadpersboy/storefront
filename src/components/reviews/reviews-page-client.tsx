"use client";

import { useEffect, useState, useTransition } from "react";
import { Eye, MessageSquare, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Table, TableBody, TableCard, TableCell, TableHead, TableHeaderRow, TableRow } from "@/components/ui/table";
import { ReviewStars } from "@/components/reviews/review-stars";
import { ReviewDetailModal } from "@/components/reviews/review-detail-modal";
import { STATUS_TONE } from "@/components/reviews/review-tones";
import {
  REVIEW_RECOMMENDATION_LABELS,
  REVIEW_REJECTION_REASON_MAX,
  REVIEW_STATUS_LABELS,
  REVIEW_STATUSES,
} from "@/lib/reviews/constants";
import type { AdminReviewDTO } from "@/lib/reviews/serialize";
import { toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  ...REVIEW_STATUSES.map((s) => ({ value: s, label: REVIEW_STATUS_LABELS[s] })),
];
const ratingOptions = [
  { value: "all", label: "همه امتیازها" },
  ...[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${toPersianDigits(n)} ستاره` })),
];
const verifiedOptions = [
  { value: "all", label: "همه کاربران" },
  { value: "true", label: "فقط خریداران" },
  { value: "false", label: "غیرخریداران" },
];

type Action = { kind: "approve" | "reject" | "delete"; item: AdminReviewDTO };

const ACTION_COPY = {
  approve: { title: "تأیید نظر", confirm: "تأیید", variant: "primary" as const },
  reject: { title: "رد نظر", confirm: "رد", variant: "danger" as const },
  delete: { title: "حذف نظر", confirm: "حذف", variant: "danger" as const },
};

const iconBtn =
  "flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground";

export function ReviewsPageClient({ canManage }: { canManage: boolean }) {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [rating, setRating] = useState("all");
  const [verified, setVerified] = useState("all");
  const [page, setPage] = useState(1);

  const [items, setItems] = useState<AdminReviewDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [detailId, setDetailId] = useState<string | null>(null);
  const [pending, setPending] = useState<Action | null>(null);
  const [reason, setReason] = useState("");
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
    if (rating !== "all") params.set("rating", rating);
    if (verified !== "all") params.set("verified", verified);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/reviews/admin?${params}`);
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
  }, [page, search, status, rating, verified, reloadToken]);

  function closeAction() {
    setPending(null);
    setReason("");
    setActionError(null);
  }

  async function confirmAction() {
    if (!pending) return;
    setActing(true);
    setActionError(null);
    try {
      const base = `/api/v1/reviews/admin/${pending.item.id}`;
      const res =
        pending.kind === "delete"
          ? await fetch(base, { method: "DELETE" })
          : pending.kind === "approve"
            ? await fetch(`${base}/approve`, { method: "POST" })
            : await fetch(`${base}/reject`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rejectionReason: reason }),
              });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setActionError(body.message ?? "خطا در انجام عملیات");
        return;
      }
      closeAction();
      setReloadToken((t) => t + 1);
    } catch {
      setActionError("ارتباط با سرور برقرار نشد");
    } finally {
      setActing(false);
    }
  }

  const pageReset = (setter: (v: string) => void) => (v: string) => {
    setter(v);
    setPage(1);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="جستجوی محصول یا کاربر..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="sm:w-44">
          <Combobox value={status} onChange={pageReset(setStatus)} options={statusOptions} />
        </div>
        <div className="sm:w-40">
          <Combobox value={rating} onChange={pageReset(setRating)} options={ratingOptions} />
        </div>
        <div className="sm:w-40">
          <Combobox value={verified} onChange={pageReset(setVerified)} options={verifiedOptions} />
        </div>
      </div>

      <TableCard className="overflow-hidden">
        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : items.length === 0 ? (
          <EmptyState icon={MessageSquare} title="نظری ثبت نشده" description="نظرات کاربران اینجا نمایش داده می‌شود." />
        ) : (
          <>
            <Table>
              <TableHeaderRow>
                <TableHead className="px-4 py-3">محصول</TableHead>
                <TableHead className="px-4 py-3">کاربر</TableHead>
                <TableHead className="px-4 py-3">امتیاز</TableHead>
                <TableHead className="px-4 py-3">توصیه</TableHead>
                <TableHead className="px-4 py-3">وضعیت</TableHead>
                <TableHead className="px-4 py-3">خریدار</TableHead>
                <TableHead className="px-4 py-3">تصویر</TableHead>
                <TableHead className="px-4 py-3">تاریخ</TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableHeaderRow>
              <TableBody>
                {items.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell mobileVariant="title" className="px-4 py-3 font-medium text-foreground">
                      {r.product?.title ?? "—"}
                    </TableCell>
                    <TableCell label="کاربر" className="px-4 py-3 text-sm">
                      {r.user?.name ?? "—"}
                    </TableCell>
                    <TableCell label="امتیاز" className="px-4 py-3">
                      <ReviewStars rating={r.rating} />
                    </TableCell>
                    <TableCell label="توصیه" className="px-4 py-3 text-sm">
                      {REVIEW_RECOMMENDATION_LABELS[r.recommendation]}
                    </TableCell>
                    <TableCell label="وضعیت" className="px-4 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{REVIEW_STATUS_LABELS[r.status]}</Badge>
                    </TableCell>
                    <TableCell label="خریدار" className="px-4 py-3 text-sm">
                      {r.isVerifiedBuyer ? "خریدار" : "—"}
                    </TableCell>
                    <TableCell label="تصویر" className="px-4 py-3 text-sm">
                      {toPersianDigits(r.imageCount)}
                    </TableCell>
                    <TableCell label="تاریخ" className="px-4 py-3 text-sm text-muted">
                      {formatJalali(r.createdAt)}
                    </TableCell>
                    <TableCell mobileVariant="actions" className="px-4 py-3">
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <button type="button" aria-label="مشاهده جزئیات" className={iconBtn} onClick={() => setDetailId(r.id)}>
                          <Eye className="size-4" />
                        </button>
                        {canManage && r.status === "pending" ? (
                          <Button size="sm" variant="secondary" onClick={() => setPending({ kind: "approve", item: r })}>
                            تأیید
                          </Button>
                        ) : null}
                        {canManage && (r.status === "pending" || r.status === "approved") ? (
                          <Button size="sm" variant="secondary" onClick={() => setPending({ kind: "reject", item: r })}>
                            رد
                          </Button>
                        ) : null}
                        {canManage ? (
                          <button
                            type="button"
                            aria-label="حذف"
                            onClick={() => setPending({ kind: "delete", item: r })}
                            className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </TableCard>

      {detailId ? <ReviewDetailModal id={detailId} onClose={() => setDetailId(null)} /> : null}

      <ConfirmDialog
        open={pending !== null}
        title={pending ? ACTION_COPY[pending.kind].title : ""}
        description={
          pending?.kind === "delete"
            ? "این نظر حذف می‌شود و در فروشگاه و آمار محصول دیده نخواهد شد."
            : pending?.kind === "reject"
              ? "نظر رد می‌شود و در فروشگاه نمایش داده نمی‌شود. دلیل رد اختیاری است."
              : "نظر تأیید می‌شود و در فروشگاه نمایش داده می‌شود."
        }
        confirmLabel={pending ? ACTION_COPY[pending.kind].confirm : "تأیید"}
        confirmVariant={pending ? ACTION_COPY[pending.kind].variant : "primary"}
        loading={acting}
        extraContent={
          <div className="flex flex-col gap-2">
            {pending?.kind === "reject" ? (
              <Textarea
                value={reason}
                maxLength={REVIEW_REJECTION_REASON_MAX}
                onChange={(e) => setReason(e.target.value)}
                placeholder="دلیل رد (اختیاری)"
                rows={3}
              />
            ) : null}
            {actionError ? <p className="text-sm text-danger">{actionError}</p> : null}
          </div>
        }
        onConfirm={confirmAction}
        onCancel={closeAction}
      />
    </div>
  );
}
