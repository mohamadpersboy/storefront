"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const COPIED_FEEDBACK_MS = 1800;

/** دکمهٔ Outline خاکستری برای رفتن به یک صفحه (جزئیات سفارش، لینک اعلان و ...). */
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
    <Link
      href={href}
      className={cn(
        "flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border border-gray-300 bg-transparent px-4 text-sm font-medium text-gray-600 transition-colors active:bg-gray-100",
        className,
      )}
    >
      {children}
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

/**
 * دکمهٔ Outline با حاشیهٔ گرادینت برای کپی کد تخفیف. حاشیه با یک
 * Wrapper گرادینتی و لایهٔ سفید داخلی ساخته شده (Border مستقیم
 * گرادینت نمی‌گیرد، ولی `border-radius` را درست دنبال می‌کند).
 */
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
    <div
      className={cn(
        "rounded-xl p-[1.5px]",
        disabled
          ? "bg-gray-200"
          : "bg-gradient-to-l from-[#499bed] via-[#8b5cf6] to-[#ec4899]",
      )}
    >
      <button
        type="button"
        onClick={handleCopy}
        disabled={disabled}
        aria-live="polite"
        className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-[10.5px] bg-white px-4 text-sm font-bold disabled:cursor-not-allowed active:bg-gray-50"
      >
        {disabled ? (
          <span className="text-gray-400">کد منقضی شده است</span>
        ) : copied ? (
          <>
            <Check className="size-4 text-emerald-500" strokeWidth={2.25} aria-hidden="true" />
            <span className="text-emerald-600">کد کپی شد</span>
          </>
        ) : (
          <>
            <Copy className="size-4 text-[#8b5cf6]" strokeWidth={2} aria-hidden="true" />
            <span className="bg-gradient-to-l from-[#499bed] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent">
              کپی کد تخفیف
            </span>
          </>
        )}
      </button>
    </div>
  );
}
