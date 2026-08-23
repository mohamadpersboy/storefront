"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
  swatch?: string; // hex color — renders a small dot before the label
}

const SEARCH_THRESHOLD = 6; // below this many options, skip the search box

export function Combobox({
  value,
  onChange,
  options,
  placeholder = "انتخاب کنید",
  disabled = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      searchInputRef.current?.focus();
    }
  }, [open]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className={cn(
          "flex h-11 w-full items-center justify-between rounded-[var(--radius-md)] border border-border bg-white px-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("flex items-center gap-2", !selected && "text-muted-foreground")}>
          {selected?.swatch ? (
            <span
              className="size-3.5 shrink-0 rounded-full border border-black/10"
              style={{ backgroundColor: selected.swatch }}
            />
          ) : null}
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-lg">
          {options.length > SEARCH_THRESHOLD ? (
            <div className="relative border-b border-border p-2">
              <Search className="pointer-events-none absolute right-4 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
              <input
                ref={searchInputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="جستجو..."
                className="h-8 w-full rounded-[var(--radius-sm)] bg-surface-subtle px-3 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          ) : null}

          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? (
              <li className="px-3 py-2.5 text-xs text-muted">موردی یافت نشد</li>
            ) : (
              filtered.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={option.value === value}
                    disabled={option.disabled}
                    onClick={() => {
                      if (option.disabled) return;
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm hover:bg-surface-subtle disabled:cursor-not-allowed disabled:text-muted-foreground disabled:hover:bg-transparent",
                      option.value === value
                        ? "font-medium text-primary"
                        : "text-foreground",
                    )}
                  >
                    {option.swatch ? (
                      <span
                        className="size-3.5 shrink-0 rounded-full border border-black/10"
                        style={{ backgroundColor: option.swatch }}
                      />
                    ) : null}
                    <span className="flex-1">{option.label}</span>
                    {option.value === value ? (
                      <Check className="size-4 shrink-0" />
                    ) : null}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
