"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronLeft, Copy } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const COPIED_FEEDBACK_MS = 1800;

/**
 * دکمهٔ لینک عمومی (اطلاعیه، سیستم، ...): Outline لاجوردی تم، کوچک و
 * کم‌ارتفاع (هم‌خانوادهٔ دکمهٔ «پرداخت» ولی فشرده‌تر).
 */
const OUTLINE_BUTTON =
  "flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border-2 border-[var(--color-primary)] bg-[var(--color-primary-soft)] px-3 text-xs font-bold text-[var(--color-primary)] transition-colors active:bg-[var(--color-primary)]/10";

/** دکمهٔ Outline برای رفتن به یک صفحه (لینک اعلان‌های غیرسفارش). */
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
      <ChevronLeft className="size-3.5" strokeWidth={2.5} aria-hidden="true" />
    </Link>
  );
}

export type OrderTone = "amber" | "blue" | "cyan" | "emerald" | "rose";

/** حاشیه با دو رنگ هگز (برای Gradient واقعی روی `border-box`)؛ متن با کلاس Tailwind. */
const ORDER_TONE_STYLE: Record<OrderTone, { from: string; to: string; text: string; icon: string }> = {
  amber: { from: "#fbbf24", to: "#f97316", text: "from-amber-500 to-orange-600", icon: "text-orange-500" },
  blue: { from: "#38bdf8", to: "#6366f1", text: "from-sky-500 to-indigo-600", icon: "text-indigo-500" },
  cyan: { from: "#22d3ee", to: "#14b8a6", text: "from-cyan-500 to-teal-600", icon: "text-teal-500" },
  emerald: { from: "#34d399", to: "#14b8a6", text: "from-emerald-500 to-teal-600", icon: "text-emerald-500" },
  rose: { from: "#fb7185", to: "#ef4444", text: "from-rose-500 to-red-600", icon: "text-rose-500" },
};

/**
 * حاشیهٔ گرادینتی واقعی: زمینهٔ سفید روی `padding-box` و گرادینت روی
 * `border-box` با حاشیهٔ شفاف. یک المان واحد است (بدون Wrapper)، پس
 * حاشیه هرگز زیر زمینهٔ سفید دیگری نمی‌رود و گوشه‌ها درست گرد می‌مانند.
 */
function gradientBorderStyle(from: string, to: string, fill = "#ffffff"): React.CSSProperties {
  return {
    background: `linear-gradient(${fill}, ${fill}) padding-box, linear-gradient(to left, ${from}, ${to}) border-box`,
  };
}

/** رنگ دکمهٔ سفارش بر اساس وضعیت سفارش (یا نتیجهٔ پرداخت). */
export function orderToneFor(meta: {
  status?: string;
  payment?: "success" | "failed";
}): OrderTone {
  if (meta.payment) return meta.payment === "success" ? "emerald" : "rose";
  switch (meta.status) {
    case "pending":
      return "amber";
    case "shipped":
      return "cyan";
    case "delivered":
      return "emerald";
    case "cancelled":
    case "returned":
      return "rose";
    default:
      return "blue";
  }
}

/**
 * دکمهٔ کوچک رفتن به جزئیات سفارش با حاشیهٔ گرادینت متناسب با وضعیت
 * (هم‌الگوی دکمهٔ کپی کد تخفیف: Wrapper گرادینتی + لایهٔ سفید داخلی).
 */
export function OrderLinkButton({
  href,
  tone,
  children,
}: {
  href: string;
  tone: OrderTone;
  children: React.ReactNode;
}) {
  const style = ORDER_TONE_STYLE[tone];
  return (
    <Link
      href={href}
      style={gradientBorderStyle(style.from, style.to)}
      className="flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border-2 border-transparent px-3 text-xs font-bold active:opacity-80"
    >
      <span className={cn("bg-gradient-to-l bg-clip-text text-transparent", style.text)}>
        {children}
      </span>
      <ChevronLeft className={cn("size-3.5", style.icon)} strokeWidth={2.5} aria-hidden="true" />
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

  // حاشیه و متن هر دو با وضعیت عوض می‌شوند: عادی = گرادینت، کپی‌شده = سبز، منقضی = خاکستری.
  const border = disabled
    ? gradientBorderStyle("#e5e7eb", "#e5e7eb")
    : copied
      ? gradientBorderStyle("#34d399", "#10b981", "#ecfdf5")
      : gradientBorderStyle("#499bed", "#ec4899");

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={disabled}
      aria-live="polite"
      style={border}
      className="flex min-h-[42px] w-full items-center justify-center gap-1.5 rounded-xl border-2 border-transparent px-4 text-sm font-bold disabled:cursor-not-allowed active:opacity-80"
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
  );
}
