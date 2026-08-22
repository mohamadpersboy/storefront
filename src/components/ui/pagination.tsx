import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { toPersianDigits } from "@/lib/utils/format";

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-5 py-3">
      <p className="text-xs text-muted">
        صفحه {toPersianDigits(page)} از {toPersianDigits(totalPages)}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="صفحه قبل"
          className={cn(
            "flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
          )}
        >
          <ChevronRight className="size-4" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="صفحه بعد"
          className={cn(
            "flex size-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:bg-surface-subtle disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
          )}
        >
          <ChevronLeft className="size-4" />
        </button>
      </div>
    </div>
  );
}
