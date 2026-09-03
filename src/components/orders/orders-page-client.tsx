"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, ShoppingCart } from "lucide-react";
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
import { OrderStatusBadge } from "@/components/orders/order-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants/order-status";
import { orderStatusLabels } from "@/components/orders/order-status-badge";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiOrder {
  id: string;
  orderNumber: number;
  customer: { fullName?: string; phoneNumber: string } | null;
  itemsCount: number;
  totalAmount: number;
  status: OrderStatus;
  createdAt: string;
}

const statusOptions = [
  { value: "all", label: "همه وضعیت‌ها" },
  ...ORDER_STATUSES.map((s) => ({ value: s, label: orderStatusLabels[s] })),
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function OrdersPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [orders, setOrders] = useState<ApiOrder[]>([]);
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
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/orders?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setOrders(body.data);
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
            placeholder="جستجو بر اساس شماره سفارش یا مشتری"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="sm:w-48">
          <Combobox
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as OrderStatus | "all");
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
        <Link href="/dashboard/orders/new">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            سفارش جدید
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
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ShoppingCart}
            title="سفارشی یافت نشد"
            description="جستجو یا فیلتر را تغییر دهید، یا سفارش جدیدی ثبت کنید."
          />
        ) : (
          <Table>
            <TableHeaderRow>
              <TableHead>شماره سفارش</TableHead>
              <TableHead>مشتری</TableHead>
              <TableHead>اقلام</TableHead>
              <TableHead>مبلغ کل</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead>تاریخ</TableHead>
            </TableHeaderRow>
            <TableBody>
              {orders.map((o) => (
                <TableRow key={o.id} href={`/dashboard/orders/${o.id}`}>
                  <TableCell mobileVariant="title">
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      #{toPersianDigits(o.orderNumber)}
                    </Link>
                  </TableCell>
                  <TableCell label="مشتری" className="text-foreground/80">
                    {o.customer?.fullName ??
                      (o.customer?.phoneNumber ? toPersianDigits(o.customer.phoneNumber) : "—")}
                  </TableCell>
                  <TableCell label="اقلام" className="tabular-nums text-foreground/80">
                    {toPersianDigits(o.itemsCount)}
                  </TableCell>
                  <TableCell label="مبلغ کل" className="tabular-nums text-foreground/80">
                    {formatToman(o.totalAmount)}
                  </TableCell>
                  <TableCell label="وضعیت">
                    <OrderStatusBadge status={o.status} />
                  </TableCell>
                  <TableCell label="تاریخ" className="tabular-nums text-muted">
                    {formatDate(o.createdAt)}
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
