"use client";

import { useState } from "react";
import { ShoppingCart, Phone, Calendar, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/users/role-badge";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { toPersianDigits } from "@/lib/utils/format";
import type { MockUser } from "@/lib/mock/users";
import type { Role } from "@/lib/constants/rbac";

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "super_admin", label: "مدیر کل" },
  { value: "admin", label: "مدیر" },
  { value: "staff", label: "کارمند" },
  { value: "customer", label: "مشتری" },
];

export function UserDetailCard({ user }: { user: MockUser }) {
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
        این صفحه روی داده نمایشی (Mock) کار می‌کند. تغییر نقش و
        فعال/غیرفعال‌سازی فعلاً غیرفعال هستند — چون هنوز به Backend وصل
        نشده‌اند (طبق قانون «No Fake Data»، دکمه‌ای که کاری واقعی انجام
        نمی‌دهد نباید فعال به نظر برسد).
      </div>

      <Card>
        <CardHeader
          title={user.fullName ?? "بدون نام"}
          description={user.phoneNumber}
          action={<UserStatusBadge isActive={user.isActive} />}
        />
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Phone className="size-4 text-muted" />
              <span dir="ltr">{user.phoneNumber}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <ShoppingCart className="size-4 text-muted" />
              {toPersianDigits(user.ordersCount)} سفارش
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Calendar className="size-4 text-muted" />
              عضویت {user.createdAt}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Clock className="size-4 text-muted" />
              {user.lastLoginAt
                ? `آخرین ورود ${user.lastLoginAt}`
                : "هنوز وارد نشده"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader title="نقش و دسترسی" />
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <RoleBadge role={user.role} />
            <span className="text-xs text-muted">نقش فعلی</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-1.5 block text-xs font-medium text-foreground/80">
                تغییر نقش
              </label>
              <Select
                value={selectedRole}
                disabled
                onChange={(e) => setSelectedRole(e.target.value as Role)}
              >
                {roleOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button variant="secondary" disabled>
              ذخیره تغییرات
            </Button>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                {user.isActive ? "غیرفعال کردن کاربر" : "فعال کردن کاربر"}
              </p>
              <p className="mt-0.5 text-xs text-muted">
                کاربر غیرفعال نمی‌تواند وارد حساب خود شود.
              </p>
            </div>
            <Button variant={user.isActive ? "danger" : "secondary"} disabled>
              {user.isActive ? "غیرفعال کردن" : "فعال کردن"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
