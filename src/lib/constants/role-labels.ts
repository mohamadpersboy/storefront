import type { Role } from "@/lib/constants/rbac";

/**
 * برچسب فارسی هر نقش — قبلاً فقط داخل `dashboard-shell.tsx` تعریف
 * شده بود؛ به اینجا منتقل شد تا Storefront (صفحه حساب کاربری) هم
 * بدون Duplicate Code از همان مپینگ استفاده کند.
 */
export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "مدیر کل",
  admin: "مدیر",
  staff: "کارمند",
  customer: "مشتری",
};
