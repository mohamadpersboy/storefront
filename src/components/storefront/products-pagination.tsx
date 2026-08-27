import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toPersianDigits } from "@/lib/utils/format";

/** Builds `?page=N` while preserving the other current query params. */
function pageHref(basePath: string, params: Record<string, string | undefined>, page: number) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value) search.set(key, value);
  }
  search.set("page", String(page));
  return `${basePath}?${search.toString()}`;
}

export function ProductsPagination({
  basePath,
  params,
  page,
  totalPages,
}: {
  basePath: string;
  params: Record<string, string | undefined>;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const linkClass = (disabled: boolean) =>
    cn(
      "flex size-9 items-center justify-center rounded-[var(--radius-sm)] border border-border text-muted hover:bg-surface-subtle",
      disabled && "pointer-events-none opacity-40",
    );

  return (
    <div className="mt-6 flex items-center justify-between">
      <p className="text-xs text-muted">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </p>
      <div className="flex items-center gap-2">
        <Link
          href={pageHref(basePath, params, page - 1)}
          aria-label="صفحه قبل"
          className={linkClass(page <= 1)}
        >
          <ChevronRight className="size-4" />
        </Link>
        <Link
          href={pageHref(basePath, params, page + 1)}
          aria-label="صفحه بعد"
          className={linkClass(page >= totalPages)}
        >
          <ChevronLeft className="size-4" />
        </Link>
      </div>
    </div>
  );
}
