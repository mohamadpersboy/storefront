"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Users as UsersIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/users/role-badge";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { mockUsers } from "@/lib/mock/users";
import { toPersianDigits } from "@/lib/utils/format";
import type { Role } from "@/lib/constants/rbac";

const PAGE_SIZE = 8;

const roleOptions: Array<{ value: Role | "all"; label: string }> = [
  { value: "all", label: "همه نقش‌ها" },
  { value: "super_admin", label: "مدیر کل" },
  { value: "admin", label: "مدیر" },
  { value: "staff", label: "کارمند" },
  { value: "customer", label: "مشتری" },
];

export function UsersPageClient() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim();
    return mockUsers.filter((u) => {
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesQuery =
        query === "" ||
        u.phoneNumber.includes(query) ||
        (u.fullName ?? "").includes(query);
      return matchesRole && matchesQuery;
    });
  }, [search, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        داده‌های این صفحه نمایشی (Mock) هستند؛ جستجو و فیلتر واقعاً روی
        همین داده نمایشی کار می‌کنند و در فاز Backend به API واقعی
        (با mongoose-paginate-v2) وصل می‌شوند.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="جستجو بر اساس نام یا شماره موبایل"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
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
        {pageItems.length === 0 ? (
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
                  <th className="px-5 py-3 font-medium">تعداد سفارش</th>
                  <th className="px-5 py-3 font-medium">تاریخ عضویت</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((u) => (
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
                    <td className="px-5 py-3 tabular-nums text-foreground/80" dir="ltr">
                      {u.phoneNumber}
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3">
                      <UserStatusBadge isActive={u.isActive} />
                    </td>
                    <td className="px-5 py-3 tabular-nums text-foreground/80">
                      {toPersianDigits(u.ordersCount)}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted">
                      {u.createdAt}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </Card>
    </div>
  );
}
