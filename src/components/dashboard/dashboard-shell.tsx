"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { dashboardNav } from "@/lib/constants/dashboard-nav";
import { cn } from "@/lib/utils/cn";
import type { Role } from "@/lib/constants/rbac";

const roleLabels: Record<Role, string> = {
  super_admin: "مدیر کل",
  admin: "مدیر",
  staff: "کارمند",
  customer: "مشتری",
};

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3">
      {dashboardNav.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        if (!item.enabled) {
          return (
            <span
              key={item.href}
              className="flex cursor-not-allowed items-center justify-between gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm text-muted-foreground/70"
              title="این بخش هنوز آماده نشده است"
            >
              <span className="flex items-center gap-3">
                <Icon className="size-[18px]" strokeWidth={1.75} />
                {item.label}
              </span>
              <span className="rounded-[var(--radius-sm)] bg-surface-subtle px-1.5 py-0.5 text-[10px]">
                به‌زودی
              </span>
            </span>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary-soft text-primary"
                : "text-foreground/80 hover:bg-surface-subtle hover:text-foreground",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function BrandMark() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5">
      <span className="flex size-8 items-center justify-center rounded-[var(--radius-md)] bg-primary text-sm font-bold text-primary-foreground">
        س
      </span>
      <span className="text-sm font-semibold text-foreground">
        فرش سقطچی
      </span>
    </Link>
  );
}

interface SessionUser {
  fullName: string | null;
  phoneNumber: string;
  role: Role;
}

export function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: SessionUser;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  const displayName = user.fullName || user.phoneNumber;
  const initials = displayName.slice(0, 2);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/v1/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-surface-subtle">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 right-0 hidden w-64 border-l border-border bg-surface lg:block">
        <BrandMark />
        <NavList />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 right-0 w-72 bg-surface shadow-lg">
            <div className="flex items-center justify-between px-4 py-4">
              <BrandMark />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="بستن منو"
                className="flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-subtle"
              >
                <X className="size-5" />
              </button>
            </div>
            <NavList onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      ) : null}

      {/* Main column */}
      <div className="lg:mr-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-surface px-4 lg:px-6">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="باز کردن منو"
            className="flex size-9 items-center justify-center rounded-[var(--radius-md)] text-muted hover:bg-surface-subtle lg:hidden"
          >
            <Menu className="size-5" />
          </button>

          <h1 className="hidden text-sm font-semibold text-foreground lg:block">
            داشبورد
          </h1>

          <div className="relative mr-auto">
            <button
              onClick={() => setUserMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-[var(--radius-md)] px-2 py-1.5 hover:bg-surface-subtle"
            >
              <span className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                {initials}
              </span>
              <span className="hidden flex-col items-start sm:flex">
                <span className="text-sm font-medium leading-tight text-foreground">
                  {displayName}
                </span>
                <span className="text-[11px] leading-tight text-muted">
                  {roleLabels[user.role]}
                </span>
              </span>
              <ChevronDown className="size-4 text-muted" />
            </button>

            {userMenuOpen ? (
              <div className="absolute left-0 top-full mt-2 w-44 rounded-[var(--radius-md)] border border-border bg-surface py-1 shadow-md">
                <button
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex w-full items-center gap-2 px-3 py-2 text-right text-sm text-danger hover:bg-red-50 disabled:opacity-60"
                >
                  <LogOut className="size-4" />
                  {loggingOut ? "در حال خروج..." : "خروج از حساب"}
                </button>
              </div>
            ) : null}
          </div>
        </header>

        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
