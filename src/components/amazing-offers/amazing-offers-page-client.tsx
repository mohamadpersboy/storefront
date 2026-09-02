"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { AmazingOfferStatusBadge } from "@/components/amazing-offers/amazing-offer-status-badge";
import { AmazingOfferCountdown } from "@/components/amazing-offers/amazing-offer-countdown";
import { formatToman } from "@/lib/utils/format";
import type { AmazingOfferComputedStatus } from "@/lib/utils/amazing-offer";

const PAGE_SIZE = 10;

interface ApiOffer {
  id: string;
  product: { id: string; title: string; slug: string } | null;
  variant: { id: string; unit: string; basePrice: number } | null;
  discountType: "percent" | "fixed";
  discountValue: number;
  finalPrice: number | null;
  endAt: string;
  status: AmazingOfferComputedStatus;
}

const statusOptions: Array<{ value: AmazingOfferComputedStatus | "all"; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "scheduled", label: "زمان‌بندی‌شده" },
  { value: "expired", label: "منقضی‌شده" },
  { value: "paused", label: "متوقف‌شده" },
];

export function AmazingOffersPageClient() {
  const [statusFilter, setStatusFilter] = useState<AmazingOfferComputedStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [offers, setOffers] = useState<ApiOffer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [pendingDelete, setPendingDelete] = useState<ApiOffer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (statusFilter !== "all") params.set("status", statusFilter);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/amazing-offers?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setOffers(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, statusFilter, reloadToken]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/amazing-offers/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setActionError(body.message ?? "خطا در حذف");
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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="sm:w-56">
          <Combobox
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as AmazingOfferComputedStatus | "all");
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
        <Link href="/dashboard/amazing-offers/new">
          <Button>
            <Plus className="size-4" />
            تخفیف شگفت‌انگیز جدید
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {loading && offers.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : offers.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="هنوز تخفیف شگفت‌انگیزی ثبت نشده"
            description="با انتخاب یک محصول و Variant، یک Offer زمان‌بندی‌شده بسازید."
          />
        ) : (
          <>
            <Table>
              <TableHeaderRow>
                <TableHead className="px-4 py-3">محصول</TableHead>
                <TableHead className="px-4 py-3">تخفیف</TableHead>
                <TableHead className="px-4 py-3">قیمت نهایی</TableHead>
                <TableHead className="px-4 py-3">زمان باقی‌مانده</TableHead>
                <TableHead className="px-4 py-3">وضعیت</TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableHeaderRow>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell mobileVariant="title" className="px-4 py-3">
                      <div className="font-medium text-foreground">
                        {offer.product?.title ?? "محصول حذف‌شده"}
                      </div>
                      <div className="text-xs text-muted">{offer.variant?.unit}</div>
                    </TableCell>
                    <TableCell label="تخفیف" className="px-4 py-3 text-sm">
                      {offer.discountType === "percent"
                        ? `${offer.discountValue}٪`
                        : formatToman(offer.discountValue)}
                    </TableCell>
                    <TableCell label="قیمت نهایی" className="px-4 py-3 tabular-nums">
                      {offer.finalPrice !== null ? formatToman(offer.finalPrice) : "—"}
                    </TableCell>
                    <TableCell label="زمان باقی‌مانده" className="px-4 py-3 text-sm">
                      <AmazingOfferCountdown endAt={offer.endAt} />
                    </TableCell>
                    <TableCell label="وضعیت" className="px-4 py-3">
                      <AmazingOfferStatusBadge status={offer.status} />
                    </TableCell>
                    <TableCell mobileVariant="actions" className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 sm:justify-end">
                        <Link
                          href={`/dashboard/amazing-offers/${offer.id}/edit`}
                          className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
                          aria-label="ویرایش"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(offer)}
                          className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                          aria-label="حذف"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف تخفیف شگفت‌انگیز"
        description={`آیا از حذف این Offer برای «${pendingDelete?.product?.title ?? ""}» مطمئن هستید؟`}
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        extraContent={
          actionError ? <p className="text-sm text-danger">{actionError}</p> : undefined
        }
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDelete(null);
          setActionError(null);
        }}
      />
    </div>
  );
}
