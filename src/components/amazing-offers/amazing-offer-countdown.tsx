"use client";

import { useEffect, useState } from "react";
import { toPersianDigits } from "@/lib/utils/format";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "به پایان رسید";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${toPersianDigits(days)} روز و ${toPersianDigits(hours)} ساعت`;
  }
  const pad = (n: number) => toPersianDigits(String(n).padStart(2, "0"));
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Client-only countdown for display purposes. The actual active/expired
 * decision always comes from the server-computed `status` field (Master
 * Prompt §26) — this component never decides expiry itself.
 */
export function AmazingOfferCountdown({ endAt }: { endAt: string | Date }) {
  const target = new Date(endAt).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setNow(Date.now()), 0);
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, []);

  if (now === null) return <span className="tabular-nums text-muted">...</span>;

  return <span className="tabular-nums">{formatRemaining(target - now)}</span>;
}
