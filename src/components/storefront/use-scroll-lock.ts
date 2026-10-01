"use client";

import { useEffect } from "react";
import { acquireScrollLock, releaseScrollLock } from "@/lib/storefront/scroll-lock";

export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    acquireScrollLock();
    return releaseScrollLock;
  }, [active]);
}
