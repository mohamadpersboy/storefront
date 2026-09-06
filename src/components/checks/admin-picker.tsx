"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toPersianDigits, formatPersonWithPhone } from "@/lib/utils/format";

interface AdminUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: string;
}

/**
 * Searches `/api/v1/users` (no `role` filter passed — that endpoint
 * only accepts a single role value — and keeps admin+super_admin
 * results client-side) so a check's "دریافت‌کننده" can only be one of
 * the system's Admins (Master Prompt — Financial Management, بند ۲).
 */
export function AdminPicker({
  value,
  onChange,
}: {
  value: AdminUser | null;
  onChange: (user: AdminUser | null) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      const timeout = setTimeout(() => setResults([]), 0);
      return () => clearTimeout(timeout);
    }
    const timeout = setTimeout(() => {
      setLoading(true);
      fetch(`/api/v1/users?search=${encodeURIComponent(query)}&limit=10`)
        .then((res) => res.json())
        .then((body) => {
          if (body.success) {
            setResults(
              (body.data as AdminUser[]).filter(
                (u) => u.role === "admin" || u.role === "super_admin",
              ),
            );
          }
        })
        .catch(() => setResults([]))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface-subtle px-3 py-2">
        <span className="flex-1 text-sm text-foreground">
          {formatPersonWithPhone(value.fullName, value.phoneNumber)}
        </span>
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="تغییر دریافت‌کننده"
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
          placeholder="جستجوی نام یا شماره موبایل ادمین"
          className="pr-9"
        />
      </div>
      {loading ? <p className="text-xs text-muted">در حال جستجو...</p> : null}
      {results.length > 0 ? (
        <ul className="flex flex-col gap-1 rounded-[var(--radius-md)] border border-border bg-surface">
          {results.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(u);
                  setQuery("");
                  setResults([]);
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-right text-sm hover:bg-surface-subtle"
              >
                <span className="text-foreground">{u.fullName ?? "بدون نام"}</span>
                <span dir="ltr" className="text-xs text-muted">
                  {toPersianDigits(u.phoneNumber)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
