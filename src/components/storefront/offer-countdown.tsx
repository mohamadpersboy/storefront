"use client";

import { useEffect, useState } from "react";
import { toPersianDigits } from "@/lib/utils/format";

function pad(n: number) {
  return toPersianDigits(String(n).padStart(2, "0"));
}

function getRemaining(endAt: string) {
  const diff = new Date(endAt).getTime() - Date.now();
  if (diff <= 0) return null;
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1000);
  return { hours, minutes, seconds };
}

/**
 * Ticks locally for a smooth UX (§26: "Countdown فقط برای UX است").
 * The offer list itself is already re-computed from the backend on every
 * page load, so a stale/expired countdown here never misrepresents an
 * offer that's actually still live — it just goes quiet client-side.
 */
export function OfferCountdown({ endAt }: { endAt: string }) {
  const [remaining, setRemaining] = useState(() => getRemaining(endAt));

  useEffect(() => {
    const timer = setInterval(() => setRemaining(getRemaining(endAt)), 1000);
    return () => clearInterval(timer);
  }, [endAt]);

  if (!remaining) {
    return <span className="text-xs font-medium text-muted">پایان یافت</span>;
  }

  return (
    <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-danger" dir="ltr">
      {pad(remaining.hours)}:{pad(remaining.minutes)}:{pad(remaining.seconds)}
    </span>
  );
}
