"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiCustomer {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  isActive: boolean;
  createdAt: string;
  ordersCount: number;
  totalSpent: number;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function CustomersPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [customers, setCustomers] = useState<ApiCustomer[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
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

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/customers?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setCustomers(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          placeholder="جستجو بر اساس نام یا شماره موبایل"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="pr-9 sm:max-w-sm"
        />
      </div>

      <Card className="overflow-hidden">
        {loading && customers.length === 0 ? (
          <div className="flex flex-col gap-2 p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="مشتری‌ای یافت نشد"
            description="مشتریان به‌محض اولین سفارش یا ورود، اینجا نمایش داده می‌شوند."
          />
        ) : (
          <Table>
            <TableHeaderRow>
              <TableHead className="px-4 py-3">نام</TableHead>
              <TableHead className="px-4 py-3">شماره موبایل</TableHead>
              <TableHead className="px-4 py-3">تعداد سفارش</TableHead>
              <TableHead className="px-4 py-3">مجموع خرید</TableHead>
              <TableHead className="px-4 py-3">وضعیت</TableHead>
              <TableHead className="px-4 py-3">تاریخ عضویت</TableHead>
            </TableHeaderRow>
            <TableBody>
              {customers.map((c) => (
                <TableRow key={c.id}>
                  <TableCell mobileVariant="title" className="px-4 py-3">
                    <Link
                      href={`/dashboard/customers/${c.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {c.fullName ?? "بدون نام"}
                    </Link>
                  </TableCell>
                  <TableCell label="شماره موبایل" className="px-4 py-3">
                    <span dir="ltr" className="tabular-nums text-foreground/80">
                      {c.phoneNumber}
                    </span>
                  </TableCell>
                  <TableCell label="تعداد سفارش" className="px-4 py-3 tabular-nums">
                    {toPersianDigits(c.ordersCount)}
                  </TableCell>
                  <TableCell label="مجموع خرید" className="px-4 py-3 tabular-nums">
                    {formatToman(c.totalSpent)}
                  </TableCell>
                  <TableCell label="وضعیت" className="px-4 py-3">
                    <UserStatusBadge isActive={c.isActive} />
                  </TableCell>
                  <TableCell label="تاریخ عضویت" className="px-4 py-3 tabular-nums text-muted">
                    {formatDate(c.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {!loading && !error ? (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </Card>
    </div>
  );
}
