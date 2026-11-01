"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const COPIED_FEEDBACK_MS = 1800;

/**
 * سبک مشترک همهٔ دکمه‌های حباب: Outline لاجوردی (رنگ تم) با پس‌زمینهٔ
 * ملایم و حاشیهٔ ۲px، هم‌شکل دکمهٔ «پرداخت» در سبد خرید.
 */
const OUTLINE_BUTTON =
  "flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-4 text-sm font-bold text-[var(--color-primary)] transition-colors active:bg-[var(--color-primary)]/10";

/** دکمهٔ Outline برای رفتن به یک صفحه (جزئیات سفارش، لینک اعلان و ...). */
export function NotificationLinkButton({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={cn(OUTLINE_BUTTON, className)}>
      {children}
      <ChevronLeft className="size-4" strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // به Fallback می‌رویم.
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/** دکمهٔ Outline کپی کد تخفیف (هم‌سبک بقیهٔ دکمه‌ها؛ منقضی ← خاکستری و غیرفعال). */
export function CopyCodeButton({ code, disabled }: { code: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function handleCopy() {
    if (disabled) return;
    const ok = await copyText(code);
    if (!ok) return;
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-live="polite"
      className={cn(
        OUTLINE_BUTTON,
        disabled &&
          "cursor-not-allowed border-gray-300 bg-gray-100 text-gray-400 active:bg-gray-100",
        copied && "border-emerald-500 bg-emerald-50 text-emerald-600 active:bg-emerald-50",
      )}
    >
      {disabled ? (
        "کد منقضی شده است"
      ) : copied ? (
        <>
          <Check className="size-4" strokeWidth={2.5} aria-hidden="true" />
          کد کپی شد
        </>
      ) : (
        <>
          <Copy className="size-4" strokeWidth={2.25} aria-hidden="true" />
          کپی کد تخفیف
        </>
      )}
    </button>
  );
}
