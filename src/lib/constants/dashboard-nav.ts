import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  Users,
  UserCog,
  BadgePercent,
  Sparkles,
  Ticket,
  Wallet,
  Settings,
} from "lucide-react";

export interface DashboardNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** false = route exists but backend not implemented yet → shown as "به‌زودی" */
  enabled: boolean;
}

export const dashboardNav: DashboardNavItem[] = [
  { label: "داشبورد", href: "/dashboard", icon: LayoutDashboard, enabled: true },
  { label: "محصولات", href: "/dashboard/products", icon: Package, enabled: true },
  { label: "دسته‌بندی‌ها", href: "/dashboard/categories", icon: FolderTree, enabled: true },
  { label: "سفارش‌ها", href: "/dashboard/orders", icon: ShoppingCart, enabled: true },
  { label: "مشتریان", href: "/dashboard/customers", icon: Users, enabled: true },
  { label: "کاربران", href: "/dashboard/users", icon: UserCog, enabled: true },
  { label: "تخفیف‌ها", href: "/dashboard/discounts", icon: BadgePercent, enabled: true },
  { label: "کدهای تخفیف", href: "/dashboard/coupons", icon: Ticket, enabled: true },
  { label: "تخفیف‌های شگفت‌انگیز", href: "/dashboard/amazing-offers", icon: Sparkles, enabled: true },
  { label: "درخواست‌های برداشت", href: "/dashboard/wallets/withdrawals", icon: Wallet, enabled: true },
  { label: "تنظیمات", href: "/dashboard/settings", icon: Settings, enabled: true },
];

