"use client";

import { useEffect } from "react";

/**
 * ثبت Service Worker در `layout.tsx` ریشه — یعنی هم روی Storefront
 * هم روی Dashboard فعال است، چون Scope فایل Manifest (`/`) کل سایت
 * را پوشش می‌دهد.
 *
 * این یک Client Component "بی‌صدا" است — چیزی رندر نمی‌کند
 * (`return null`)، فقط Side Effect ثبت SW را در `useEffect` انجام
 * می‌دهد. خطای ثبت (مثلاً مرورگرهای بدون پشتیبانی) کاملاً
 * Best-effort و بی‌صدا نادیده گرفته می‌شود — نباید هیچ‌وقت باعث
 * شکست رندر بقیه سایت شود.
 */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Best-effort — نصب PWA نباید در صورت شکست ثبت SW مسدود شود.
    });
  }, []);

  return null;
}
