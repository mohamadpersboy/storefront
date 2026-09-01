import { Badge } from "@/components/ui/badge";
import type { Role } from "@/lib/constants/rbac";

const roleConfig: Record<
  Role,
  { label: string; tone: "neutral" | "primary" | "warning" | "success" }
> = {
  super_admin: { label: "مدیر کل", tone: "primary" },
  admin: { label: "مدیر", tone: "primary" },
  staff: { label: "کارمند", tone: "warning" },
  customer: { label: "مشتری", tone: "neutral" },
};

const unknownRoleConfig = { label: "نامشخص", tone: "neutral" as const };

export function RoleBadge({ role }: { role: Role }) {
  // اگر یک رکورد قدیمی/دستکاری‌شده در DB مقداری خارج از ۴ نقش تعریف‌شده
  // داشته باشد (مثلاً از قبل از اضافه‌شدن RBAC)، به‌جای Crash کردن کل
  // صفحه، یک Badge خنثی «نامشخص» نمایش داده می‌شود.
  const config = roleConfig[role] ?? unknownRoleConfig;
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
