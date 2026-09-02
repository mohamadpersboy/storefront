import { cn } from "@/lib/utils/cn";

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
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 hover:bg-surface-subtle sm:border-b",
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
  dir,
}: {
  children?: React.ReactNode;
  className?: string;
  label?: string;
  mobileVariant?: TableCellMobileVariant;
  dir?: "ltr" | "rtl";
}) {
  return (
    <td
      dir={dir}
      data-label={mobileVariant === "row" ? label : undefined}
      data-mobile={mobileVariant !== "row" ? mobileVariant : undefined}
      className={cn("px-5 py-3 text-center", className)}
    >
      {children}
    </td>
  );
}
