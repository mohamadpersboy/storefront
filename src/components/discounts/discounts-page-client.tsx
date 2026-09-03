"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { BadgePercent, Pencil } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import {
  Table,
  TableCard,
  TableHeaderRow,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

const PAGE_SIZE = 10;

interface ApiProduct {
  id: string;
  title: string;
  variantsCount: number;
  discountedVariantsCount: number;
  minPrice: number;
}

/**
 * Read-only overview — actual discount editing stays on the Product
 * form (variant-level discountPercent/discountAmount), where the
 * fields already live. Duplicating that write path here would create
 * two sources of truth for the same data.
 */
export function DiscountsPageClient() {
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [loading, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      hasDiscount: "true",
    });

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
  }, [page]);

  return (
    <TableCard className="overflow-hidden">
      {loading && products.length === 0 ? (
        <div className="flex flex-col gap-2 p-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <ErrorState />
      ) : products.length === 0 ? (
        <EmptyState
          icon={BadgePercent}
          title="هیچ محصولی تخفیف فعال ندارد"
          description="تخفیف هر محصول از داخل فرم ویرایش همان محصول، در سطح Variant تنظیم می‌شود."
        />
      ) : (
        <>
          <Table>
            <TableHeaderRow>
              <TableHead className="px-4 py-3">محصول</TableHead>
              <TableHead className="px-4 py-3">Variantهای تخفیف‌دار</TableHead>
              <TableHead className="px-4 py-3">کمترین قیمت نهایی</TableHead>
              <TableHead className="px-4 py-3"></TableHead>
            </TableHeaderRow>
            <TableBody>
              {products.map((p) => (
                <TableRow key={p.id} href={`/dashboard/products/${p.id}/edit`}>
                  <TableCell mobileVariant="title" className="px-4 py-3 font-medium text-foreground">
                    {p.title}
                  </TableCell>
                  <TableCell label="Variantهای تخفیف‌دار" className="px-4 py-3 tabular-nums">
                    {toPersianDigits(p.discountedVariantsCount)} از{" "}
                    {toPersianDigits(p.variantsCount)}
                  </TableCell>
                  <TableCell label="کمترین قیمت نهایی" className="px-4 py-3 tabular-nums">
                    {formatToman(p.minPrice)}
                  </TableCell>
                  <TableCell mobileVariant="actions" className="px-4 py-3">
                    <Link
                      href={`/dashboard/products/${p.id}/edit`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle hover:text-foreground"
                      aria-label="ویرایش محصول"
                    >
                      <Pencil className="size-4" />
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </TableCard>
  );
}
