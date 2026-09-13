"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

/**
 * دکمه خروج از حساب — عیناً هم‌الگو با `handleLogout` موجود در
 * `dashboard-shell.tsx` (همان Endpoint، همان ترتیب Push+Refresh)،
 * فقط مقصد بعد از خروج برای Storefront صفحه لاگین فروشگاه است.
 */
export function AccountLogoutButton() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

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
    <button
      type="button"
      onClick={handleLogout}
      disabled={loggingOut}
      className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-red-100 bg-red-50 py-3.5 text-sm font-bold text-red-600 active:bg-red-100 disabled:opacity-60"
    >
      <LogOut className="size-4" strokeWidth={1.75} aria-hidden="true" />
      {loggingOut ? "در حال خروج…" : "خروج از حساب"}
    </button>
  );
}
