"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * پیغام پیشنهاد نصب PWA — فقط داخل Storefront رندر می‌شود (مشتری
 * هدف نصب است، نه ادمین Dashboard).
 *
 * مرورگر رویداد `beforeinstallprompt` را فقط زمانی Fire می‌کند که
 * معیارهای Installability (Manifest معتبر + Service Worker + HTTPS)
 * برآورده باشند و کاربر قبلاً سایت را نصب نکرده باشد — پس این بنر
 * خودش تصمیم نمی‌گیرد "قابل‌نصب است یا نه"، فقط منتظر همین رویداد
 * می‌ماند. Safari/iOS این رویداد را اصلاً پشتیبانی نمی‌کند (Safari
 * راه نصب بومی خودش را دارد)، پس روی iOS این بنر هرگز ظاهر نمی‌شود
 * — این یک محدودیت شناخته‌شده مرورگر است، نه باگ.
 *
 * منطق ۳۰ روز (طبق درخواست صریح کارفرما): اگر کاربر روی «فعلاً نه»
 * زد یا دیالوگ بومی مرورگر را رد کرد، زمان آن در `localStorage` ثبت
 * می‌شود و تا ۳۰ روز بعد این بنر دوباره نشان داده نمی‌شود. اگر واقعاً
 * نصب کرد (یا سایت از قبل نصب‌شده تشخیص داده شود)، دیگر هیچ‌وقت این
 * بنر نمایش داده نمی‌شود.
 */

const DISMISSED_AT_KEY = "sf-pwa-install-dismissed-at";
const INSTALLED_KEY = "sf-pwa-installed";
const SUPPRESS_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // ۳۰ روز

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isSuppressed(): boolean {
  if (typeof window === "undefined") return true;

  if (window.localStorage.getItem(INSTALLED_KEY) === "1") {
    return true;
  }

  // اگر مرورگر تشخیص دهد سایت همین الان به‌صورت PWA در حال اجراست
  // (Standalone)، یعنی از قبل نصب شده — دیگر لازم نیست بپرسیم.
  if (window.matchMedia?.("(display-mode: standalone)").matches) {
    return true;
  }

  const dismissedAt = window.localStorage.getItem(DISMISSED_AT_KEY);
  if (!dismissedAt) return false;

  const elapsed = Date.now() - Number(dismissedAt);
  return elapsed < SUPPRESS_DURATION_MS;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(event: Event) {
      event.preventDefault();
      if (isSuppressed()) return;

      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }

    function handleAppInstalled() {
      window.localStorage.setItem(INSTALLED_KEY, "1");
      setVisible(false);
      setDeferredPrompt(null);
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  function dismissFor30Days() {
    window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    setVisible(false);
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      window.localStorage.setItem(INSTALLED_KEY, "1");
    } else {
      // کاربر در دیالوگ بومی مرورگر هم رد کرد — همان قانون ۳۰ روز.
      window.localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    }

    setDeferredPrompt(null);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="پیشنهاد نصب اپلیکیشن"
      className={cn(
        "fixed inset-x-3 z-50 sm:inset-x-auto sm:right-4 sm:w-96",
        "bottom-[calc(76px+env(safe-area-inset-bottom)+12px)] sm:bottom-4",
        "flex items-center gap-3 rounded-2xl border border-black/5",
        "bg-white/95 p-3 shadow-lg backdrop-blur-xl",
      )}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
        <Download className="h-5 w-5" aria-hidden="true" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-gray-900">
          نصب اپلیکیشن فرش سقطچی
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          دسترسی سریع‌تر، بدون نیاز به مرورگر
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={handleInstallClick}
          className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-bold text-[var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]"
        >
          نصب
        </button>
        <button
          type="button"
          onClick={dismissFor30Days}
          aria-label="بستن و عدم نمایش تا ۳۰ روز آینده"
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
