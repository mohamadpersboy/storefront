"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatToman, toPersianDigits } from "@/lib/utils/format";

export interface CheckOption {
  id: string;
  amount: number;
  sayadiId: string;
  bank: { name: string } | null;
}

/**
 * Searches `/api/v1/checks` on the server (`search` query param —
 * already supported by the API for issuer name/nationalId/phone/
 * checkSeries/checkNumber/sayadiId) instead of loading a fixed page
 * of checks into the browser and filtering client-side. Necessary
 * once the number of registered checks grows large — picking a
 * check by scrolling through "all checks" stops being practical.
 * Modeled on `AdminPicker`'s debounced-search pattern.
 */
export function CheckPicker({
  value,
  onChange,
  status = "registered",
}: {
  value: CheckOption | null;
  onChange: (check: CheckOption | null) => void;
  status?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CheckOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      const timeout = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(
        `/api/v1/checks?search=${encodeURIComponent(query)}&status=${status}&limit=10`,
      )
        .then((res) => res.json())
        .then((body) => {
          if (body.success) setResults(body.data as CheckOption[]);
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query, status]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3 py-2">
        <span className="flex-1 text-sm text-foreground">
          {formatToman(value.amount)} — {value.bank?.name ?? ""} — صیادی{" "}
          {toPersianDigits(value.sayadiId)}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="تغییر چک"
          className="text-muted hover:text-danger"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="جستجوی چک بر اساس نام صادرکننده، کد ملی، شماره تماس یا شناسه صیادی"
          className="pr-9"
        />
      </div>
      {loading ? <p className="text-xs text-muted">در حال جستجو...</p> : null}
      {!loading && query.trim() && results.length === 0 ? (
        <p className="text-xs text-muted">موردی یافت نشد</p>
      ) : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-border bg-surface">
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(c);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-right text-sm hover:bg-surface-subtle"
              >
                <span className="text-foreground">{formatToman(c.amount)}</span>
                <span className="text-xs text-muted">
                  {c.bank?.name ?? ""} — صیادی {toPersianDigits(c.sayadiId)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
