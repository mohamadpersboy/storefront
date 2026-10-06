"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getActiveScroller } from "@/lib/storefront/scroll-container";
import { createScrollMemory, type ScrollMemory } from "@/lib/storefront/scroll-memory";

let memory: ScrollMemory | null = null;
function getMemory(): ScrollMemory {
  if (!memory) {
    let storage: Storage | null = null;
    try {
      storage = window.sessionStorage;
    } catch {
      storage = null;
    }
    memory = createScrollMemory(storage);
  }
  return memory;
}

const urlKey = () => window.location.pathname + window.location.search;

/** هدف بازیابی که هنگام popstate (قبل از رندر صفحه جدید) خوانده می‌شود. */
let pendingTraverse: { top: number } | null = null;
let popListenerInstalled = false;
let firstRun = true;

function installPopListener() {
  if (popListenerInstalled) return;
  popListenerInstalled = true;
  window.addEventListener("popstate", () => {
    pendingTraverse = { top: getMemory().get(urlKey()) ?? 0 };
  });
}

function isReloadOrTraverse(): boolean {
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return nav?.type === "reload" || nav?.type === "back_forward";
}

/** محتوا ممکن است دیرتر (Streaming) بلند شود؛ چند فریم تلاش می‌کنیم. */
function applyScrollTop(top: number, triesLeft = 20) {
  const el = getActiveScroller();
  if (!el) return;
  el.scrollTop = top;
  if (top > 0 && Math.abs(el.scrollTop - top) > 1 && triesLeft > 0) {
    requestAnimationFrame(() => applyScrollTop(top, triesLeft - 1));
  }
}

/**
 * مدیریت اسکرول قاب دسکتاپ (فقط وقتی قاب Scroll Container است):
 * - ناوبری جدید (لینک/`router.push`): قاب به بالا می‌رود.
 * - Back/Forward و Refresh: موقعیت ذخیره‌شدهٔ همان URL بازیابی می‌شود.
 * روی موبایل/تبلت هیچ کاری نمی‌کند (پنجره Scroll می‌کند و Next.js خودش
 * مدیریتش می‌کند).
 */
export function useFrameScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const scroller = getActiveScroller();
    if (!scroller) return;
    installPopListener();

    const key = urlKey();
    let restoreTop = 0;
    if (pendingTraverse) restoreTop = pendingTraverse.top;
    else if (firstRun && isReloadOrTraverse()) restoreTop = getMemory().get(key) ?? 0;
    pendingTraverse = null;
    firstRun = false;

    const startFrame = requestAnimationFrame(() => applyScrollTop(restoreTop));

    let frame = 0;
    function onScroll() {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        const el = getActiveScroller();
        // فقط وقتی هنوز روی همان URL هستیم (جلوگیری از ذخیرهٔ مقدار
        // Clamp‌شده هنگام جابه‌جایی محتوا).
        if (el && urlKey() === key) getMemory().set(key, el.scrollTop);
      });
    }
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(startFrame);
      if (frame) cancelAnimationFrame(frame);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [pathname]);
}
