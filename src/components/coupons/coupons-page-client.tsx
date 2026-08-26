"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Pencil, Plus, Search, Ticket, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { CouponStatusBadge } from "@/components/coupons/coupon-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiCoupon {
  id: string;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
  type: "public" | "private";
  status: "active" | "inactive";
  isExpired: boolean;
  usageLimit: number | null;
  usedCount: number;
  expiresAt: string;
}

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "active", label: "فعال" },
  { value: "inactive", label: "غیرفعال" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function CouponsPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  const [coupons, setCoupons] = useState<ApiCoupon[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [pendingDelete, setPendingDelete] = useState<ApiCoupon | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (search) params.set("search", search);
    if (status !== "all") params.set("status", status);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/coupons?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setCoupons(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, status, reloadToken]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/coupons/${pendingDelete.id}`, { method: "DELETE" });
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative sm:w-64">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="جستجوی کد..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pr-9"
            />
          </div>
          <div className="sm:w-48">
            <Combobox
              value={status}
              onChange={(v) => {
                setStatus(v);
                setPage(1);
              }}
              options={statusOptions}
            />
          </div>
        </div>
        <Link href="/dashboard/coupons/new">
          <Button>
            <Plus className="size-4" />
            کد تخفیف جدید
          </Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {loading && coupons.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : coupons.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="هنوز کد تخفیفی ثبت نشده"
            description="کد تخفیف جدید بسازید تا مشتریان بتوانند از آن استفاده کنند."
          />
        ) : (
          <>
            <Table>
              <TableHeaderRow>
                <TableHead className="px-4 py-3">کد</TableHead>
                <TableHead className="px-4 py-3">تخفیف</TableHead>
                <TableHead className="px-4 py-3">نوع</TableHead>
                <TableHead className="px-4 py-3">استفاده</TableHead>
                <TableHead className="px-4 py-3">انقضا</TableHead>
                <TableHead className="px-4 py-3">وضعیت</TableHead>
                <TableHead className="px-4 py-3"></TableHead>
              </TableHeaderRow>
              <TableBody>
                {coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="px-4 py-3 font-medium tabular-nums text-foreground">
                      <span dir="ltr">{c.code}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {toPersianDigits(c.discountPercentage)}٪
                      {c.maxDiscountAmount ? (
                        <span className="text-muted"> (سقف {formatToman(c.maxDiscountAmount)})</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-sm">
                      {c.type === "public" ? "عمومی" : "خصوصی"}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums">
                      {toPersianDigits(c.usedCount)}
                      {c.usageLimit ? ` از ${toPersianDigits(c.usageLimit)}` : ""}
                    </TableCell>
                    <TableCell className="px-4 py-3 tabular-nums text-muted">
                      {formatDate(c.expiresAt)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <CouponStatusBadge status={c.status} isExpired={c.isExpired} />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/coupons/${c.id}/edit`}
                          className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
                          aria-label="ویرایش"
                        >
                          <Pencil className="size-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setPendingDelete(c)}
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
        title="حذف کد تخفیف"
        description={`آیا از حذف کد «${pendingDelete?.code ?? ""}» مطمئن هستید؟`}
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
