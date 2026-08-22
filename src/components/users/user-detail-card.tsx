"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Phone, Calendar, Clock } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/users/role-badge";
import { UserStatusBadge } from "@/components/users/user-status-badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Role } from "@/lib/constants/rbac";

export interface UserDetailData {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

const roleOptions: Array<{ value: Role; label: string }> = [
  { value: "super_admin", label: "مدیر کل" },
  { value: "admin", label: "مدیر" },
  { value: "staff", label: "کارمند" },
  { value: "customer", label: "مشتری" },
];

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fa-IR").format(new Date(iso));
}

export function UserDetailCard({
  user,
  actorId,
  actorRole,
}: {
  user: UserDetailData;
  actorId: string;
  actorRole: Role;
}) {
  const router = useRouter();
  const isSelf = user.id === actorId;

  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [savingRole, setSavingRole] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Client-side hint only — the API route is the real authorization
  // boundary and re-checks all of this itself.
  const canElevateToPrivileged = actorRole === "super_admin";
  const canEditThisUser =
    !isSelf &&
    (actorRole === "super_admin" ||
      (actorRole === "admin" && user.role !== "admin" && user.role !== "super_admin"));

  async function saveRole() {
    setSavingRole(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: selectedRole }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setMessage({ type: "error", text: body.message ?? "خطایی رخ داد" });
        return;
      }
      setMessage({ type: "success", text: "نقش کاربر با موفقیت تغییر کرد" });
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "ارتباط با سرور برقرار نشد" });
    } finally {
      setSavingRole(false);
    }
  }

  async function toggleStatus() {
    setSavingStatus(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/v1/users/${user.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setMessage({ type: "error", text: body.message ?? "خطایی رخ داد" });
        return;
      }
      router.refresh();
    } catch {
      setMessage({ type: "error", text: "ارتباط با سرور برقرار نشد" });
    } finally {
      setSavingStatus(false);
      setConfirmDeactivate(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isSelf ? (
        <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800">
          این حساب خودتان است — تغییر نقش یا وضعیت حساب خودتان از این
          صفحه ممکن نیست.
        </div>
      ) : null}

      {message ? (
        <div
          className={`rounded-[var(--radius-md)] border px-4 py-2.5 text-xs ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-danger"
          }`}
        >
          {message.text}
        </div>
      ) : null}

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
              سفارش‌ها به‌زودی
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Calendar className="size-4 text-muted" />
              عضویت {formatDate(user.createdAt)}
            </div>
            <div className="flex items-center gap-2 text-sm text-foreground/80">
              <Clock className="size-4 text-muted" />
              {user.lastLoginAt
                ? `آخرین ورود ${formatDate(user.lastLoginAt)}`
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
                disabled={!canEditThisUser}
                onChange={(e) => setSelectedRole(e.target.value as Role)}
              >
                {roleOptions.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={
                      !canElevateToPrivileged &&
                      (opt.value === "admin" || opt.value === "super_admin")
                    }
                  >
                    {opt.label}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              variant="secondary"
              disabled={!canEditThisUser || selectedRole === user.role || savingRole}
              onClick={saveRole}
            >
              {savingRole ? "در حال ذخیره..." : "ذخیره تغییرات"}
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
            <Button
              variant={user.isActive ? "danger" : "secondary"}
              disabled={!canEditThisUser || savingStatus}
              onClick={() => {
                if (user.isActive) {
                  setConfirmDeactivate(true);
                } else {
                  toggleStatus();
                }
              }}
            >
              {savingStatus
                ? "در حال ثبت..."
                : user.isActive
                  ? "غیرفعال کردن"
                  : "فعال کردن"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmDeactivate}
        title="غیرفعال کردن کاربر"
        description={`آیا از غیرفعال کردن «${user.fullName ?? user.phoneNumber}» مطمئن هستید؟ این کاربر تا فعال‌سازی مجدد نمی‌تواند وارد حساب خود شود.`}
        confirmLabel="غیرفعال کردن"
        confirmVariant="danger"
        loading={savingStatus}
        onCancel={() => setConfirmDeactivate(false)}
        onConfirm={toggleStatus}
      />
    </div>
  );
}
