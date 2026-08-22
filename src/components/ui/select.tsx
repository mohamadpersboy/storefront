import { cn } from "@/lib/utils/cn";
import { ChevronDown } from "lucide-react";

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-[var(--radius-md)] border border-border bg-white px-3 pl-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
