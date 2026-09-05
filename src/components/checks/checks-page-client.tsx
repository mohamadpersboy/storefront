"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Landmark, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableCard,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { CheckStatusBadge } from "@/components/checks/check-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import { formatJalali } from "@/lib/utils/jalali";
import { CHECK_STATUSES, checkStatusLabel, type CheckStatus } from "@/lib/constants/check-status";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiCheck {
  id: string;
  bank: { id: string; name: string } | null;
  issuer: { firstName: string; lastName: string };
  receiver: { fullName: string | null; phoneNumber: string } | null;
  amount: number;
  receivedDate: string;
  dueDate: string;
  sayadiId: string;
  status: CheckStatus;
  transferredTo: { firstName?: string; lastName?: string } | null;
}

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  ...CHECK_STATUSES.map((s) => ({ value: s, label: checkStatusLabel(s) })),
];

export function ChecksPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CheckStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [checks, setChecks] = useState<ApiCheck[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [loading, startTransition] = useTransition();

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
    if (statusFilter !== "all") params.set("status", statusFilter);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/checks?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setChecks(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="جستجو بر اساس صادرکننده، شماره تماس یا شناسه صیادی"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="sm:w-56">
          <Combobox
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as CheckStatus | "all");
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
        <Link href="/dashboard/checks/new">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            چک جدید
          </Button>
        </Link>
      </div>

      <TableCard>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-12 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setPage((p) => p)} />
        ) : checks.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="چکی یافت نشد"
            description="جستجو یا فیلتر را تغییر دهید، یا چک جدیدی ثبت کنید."
          />
        ) : (
          <Table>
            <TableHeaderRow>
              <TableHead>بانک</TableHead>
              <TableHead>صادرکننده</TableHead>
              <TableHead>دریافت‌کننده</TableHead>
              <TableHead>مبلغ</TableHead>
              <TableHead>تاریخ سررسید</TableHead>
              <TableHead>وضعیت</TableHead>
            </TableHeaderRow>
            <TableBody>
              {checks.map((c) => (
                <TableRow key={c.id} href={`/dashboard/checks/${c.id}`}>
                  <TableCell mobileVariant="title">
                    <Link
                      href={`/dashboard/checks/${c.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {c.bank?.name ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell label="صادرکننده" className="text-foreground/80">
                    {c.issuer.firstName} {c.issuer.lastName}
                  </TableCell>
                  <TableCell label="دریافت‌کننده" className="text-foreground/80">
                    {c.receiver?.fullName ??
                      (c.receiver?.phoneNumber ? toPersianDigits(c.receiver.phoneNumber) : "—")}
                  </TableCell>
                  <TableCell label="مبلغ" className="tabular-nums text-foreground/80">
                    {formatToman(c.amount)}
                  </TableCell>
                  <TableCell label="تاریخ سررسید" className="tabular-nums text-muted">
                    {formatJalali(c.dueDate)}
                  </TableCell>
                  <TableCell label="وضعیت">
                    <CheckStatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && !error ? (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </TableCard>
    </div>
  );
}
