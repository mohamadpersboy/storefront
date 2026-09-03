"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
  TableCard,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ProductStatusBadge } from "@/components/products/product-status-badge";
import { formatToman, toPersianDigits } from "@/lib/utils/format";
import type { ProductStatus } from "@/models/Product";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiProduct {
  id: string;
  title: string;
  slug: string;
  category: { name: string; slug: string } | null;
  status: ProductStatus;
  coverImage: string | null;
  variantsCount: number;
  minPrice: number;
  totalStock: number;
}

const statusOptions: Array<{ value: ProductStatus | "all"; label: string }> = [
  { value: "all", label: "همه وضعیت‌ها" },
  { value: "draft", label: "پیش‌نویس" },
  { value: "published", label: "منتشرشده" },
  { value: "archived", label: "بایگانی‌شده" },
];

export function ProductsPageClient() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">("all");
  const [page, setPage] = useState(1);

  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  const [pendingDelete, setPendingDelete] = useState<ApiProduct | null>(null);
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
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (search) params.set("search", search);
    if (statusFilter !== "all") params.set("status", statusFilter);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/products?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setProducts(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, statusFilter, reloadToken]);

  async function handleDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/v1/products/${pendingDelete.id}`, {
        method: "DELETE",
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setActionError(body.message ?? "خطا در حذف محصول");
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
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="جستجو بر اساس نام محصول"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="sm:w-44">
          <Combobox
            value={statusFilter}
            onChange={(v) => {
              setStatusFilter(v as ProductStatus | "all");
              setPage(1);
            }}
            options={statusOptions}
          />
        </div>
        <Link href="/dashboard/products/new">
          <Button className="w-full sm:w-auto">
            <Plus className="size-4" />
            محصول جدید
          </Button>
        </Link>
      </div>

      {actionError ? (
        <div className="rounded-[var(--radius-md)] border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-danger">
          {actionError}
        </div>
      ) : null}

      <TableCard>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-14 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="محصولی یافت نشد"
            description="جستجو یا فیلتر را تغییر دهید، یا محصول جدیدی بسازید."
          />
        ) : (
          <Table>
            <TableHeaderRow>
              <TableHead>محصول</TableHead>
              <TableHead>دسته‌بندی</TableHead>
              <TableHead>Variantها</TableHead>
              <TableHead>شروع قیمت</TableHead>
              <TableHead>موجودی</TableHead>
              <TableHead>وضعیت</TableHead>
              <TableHead></TableHead>
            </TableHeaderRow>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} href={`/dashboard/products/${p.id}/edit`}>
                  <TableCell mobileVariant="title">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-3 sm:justify-center"
                    >
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-surface-subtle">
                        {p.coverImage ? (
                          <Image
                            src={p.coverImage}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="font-medium text-foreground hover:text-primary">
                        {p.title}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell label="دسته‌بندی" className="text-foreground/80">
                    {p.category?.name ?? "—"}
                  </TableCell>
                  <TableCell label="Variantها" className="tabular-nums text-foreground/80">
                    {toPersianDigits(p.variantsCount)}
                  </TableCell>
                  <TableCell label="شروع قیمت" className="tabular-nums text-foreground/80">
                    {formatToman(p.minPrice)}
                  </TableCell>
                  <TableCell label="موجودی" className="tabular-nums text-foreground/80">
                    {toPersianDigits(p.totalStock)}
                  </TableCell>
                  <TableCell label="وضعیت">
                    <ProductStatusBadge status={p.status} />
                  </TableCell>
                  <TableCell mobileVariant="actions">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/dashboard/products/${p.id}/edit`);
                        }}
                        aria-label="ویرایش"
                        className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPendingDelete(p);
                        }}
                        aria-label="حذف"
                        className="flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-danger hover:bg-red-50"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title="حذف محصول"
        description={`آیا از حذف «${pendingDelete?.title}» مطمئن هستید؟ محصول از فروشگاه حذف می‌شود (قابل بازیابی توسط مدیر سیستم).`}
        confirmLabel="حذف"
        confirmVariant="danger"
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
