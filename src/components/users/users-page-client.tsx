"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { RoleBadge } from "@/components/users/role-badge";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import type { Role } from "@/lib/constants/rbac";

const PAGE_SIZE = 8;
const SEARCH_DEBOUNCE_MS = 400;

interface ApiUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

const roleOptions: Array<{ value: Role | "all"; label: string }> = [
  { value: "all", label: "همه نقش‌ها" },
  { value: "super_admin", label: "مدیر کل" },
  { value: "admin", label: "مدیر" },
  { value: "staff", label: "کارمند" },
  { value: "customer", label: "مشتری" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function UsersPageClient() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(1);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const [loading, startTransition] = useTransition();

  // Debounce the search box so we don't fire a request on every keystroke.
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
    if (roleFilter !== "all") params.set("role", roleFilter);

    startTransition(async () => {
      try {
        const res = await fetch(`/api/v1/users?${params.toString()}`);
        const body = await res.json();
        if (!res.ok || !body.success) throw new Error(body.message);
        if (cancelled) return;
        setUsers(body.data);
        setTotalPages(body.pagination?.totalPages ?? 1);
        setError(false);
      } catch {
        if (!cancelled) setError(true);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [page, search, roleFilter, reloadToken]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="جستجو بر اساس نام یا شماره موبایل"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pr-9"
          />
        </div>
        <div className="sm:w-48">
          <Select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value as Role | "all");
              setPage(1);
            }}
          >
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card>
        {loading ? (
          <div className="p-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="mb-3 h-10 w-full last:mb-0" />
            ))}
          </div>
        ) : error ? (
          <ErrorState onRetry={() => setReloadToken((t) => t + 1)} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="کاربری یافت نشد"
            description="جستجو یا فیلتر را تغییر دهید."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-right text-xs text-muted">
                  <th className="px-5 py-3 font-medium">نام</th>
                  <th className="px-5 py-3 font-medium">شماره موبایل</th>
                  <th className="px-5 py-3 font-medium">نقش</th>
                  <th className="px-5 py-3 font-medium">وضعیت</th>
                  <th className="px-5 py-3 font-medium">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-border last:border-0 hover:bg-surface-subtle"
                  >
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/users/${u.id}`}
                        className="font-medium text-foreground hover:text-primary"
                      >
                        {u.fullName ?? "بدون نام"}
                      </Link>
                    </td>
                    <td
                      className="px-5 py-3 tabular-nums text-foreground/80"
                      dir="ltr"
                    >
                      {u.phoneNumber}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      <UserStatusBadge isActive={u.isActive} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error ? (
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        ) : null}
      </Card>
    </div>
  );
}
