"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

/**
 * پوششی مشابه Card برای Listهای مبتنی بر Table — روی موبایل، برخلاف
 * Card معمولی، هیچ حاشیه/پس‌زمینه‌ای ندارد (شفاف و بدون Padding)
 * چون خود Card باعث می‌شد یک «کانتینر» بزرگ دور همه کارت‌های تک‌ردیفی
 * دیده شود؛ فقط خود کارت‌های تک‌ردیفی (هر <tr>) باید حاشیه/پس‌زمینه
 * سفید داشته باشند. روی دسکتاپ دقیقاً مثل Card معمولی است.
 */
export function TableCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] border border-border bg-surface",
        "max-sm:rounded-none max-sm:border-0 max-sm:bg-transparent",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Table({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full overflow-x-auto sm:overflow-visible", className)}>
      <table className="responsive-table w-full text-sm">{children}</table>
    </div>
  );
}

export function TableHeaderRow({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-border text-xs text-muted">{children}</tr>
    </thead>
  );
}

export function TableHead({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <th className={cn("px-5 py-3 text-center font-medium", className)}>
      {children}
    </th>
  );
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  /**
   * اگر داده شود، کل ردیف (روی موبایل: کل کارت) قابل کلیک و به این
   * مسیر لینک می‌شود — نه فقط عنوان داخلش. دکمه‌های عملیات داخل ردیف
   * باید خودشان `stopPropagation` کنند تا کلیک رویشان باعث ناوبری
   * ردیف نشود.
   */
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const router = useRouter();

  return (
    <tr
      onClick={href ? () => router.push(href) : undefined}
      className={cn(
        "border-b border-border last:border-0 hover:bg-surface-subtle sm:border-b",
        href && "cursor-pointer",
        className,
      )}
    >
      {children}
    </tr>
  );
}

type TableCellMobileVariant = "row" | "title" | "actions" | "hidden";

export function TableCell({
  children,
  className,
  /** برچسب این ستون روی موبایل — باید معادل متن TableHead باشد. */
  label,
  /**
   * نحوه نمایش این سلول روی موبایل (پیش‌فرض "row" — یک ردیف
   * «برچسب: مقدار»). نگاه کنید توضیح کامل در globals.css.
   */
  mobileVariant = "row",
}: {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  mobileVariant?: TableCellMobileVariant;
}) {
  return (
    <td
      data-label={mobileVariant === "row" ? label : undefined}
      data-mobile={mobileVariant !== "row" ? mobileVariant : undefined}
      className={cn("px-5 py-3 text-center", className)}
    >
      {children}
    </td>
  );
}
