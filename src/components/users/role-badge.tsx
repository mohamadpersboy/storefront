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

export function RoleBadge({ role }: { role: Role }) {
  const config = roleConfig[role];
  return <Badge tone={config.tone}>{config.label}</Badge>;
}
