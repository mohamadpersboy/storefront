"use client";

import { useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";

const COPIED_FEEDBACK_MS = 1500;

type ReferralCodeCardProps = {
  code: string;
  inviteUrl: string;
};

/**
 * نمایش کد رفرال فعال + دکمه کپی کد + دکمه اشتراک‌گذاری لینک دعوت.
 * هم‌الگوی Web Share API با Fallback به Clipboard که در
 * `ProductTopBar` هم استفاده شده — فقط این‌بار به‌جای لینک صفحهٔ
 * جاری، لینک دعوت (`inviteUrl`) به اشتراک گذاشته می‌شود.
 */
export function ReferralCodeCard({ code, inviteUrl }: ReferralCodeCardProps) {
  const [codeCopied, setCodeCopied] = useState(false);

  async function copyCode() {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Clipboard در دسترس نبود — بی‌صدا نادیده گرفته می‌شود.
    }
  }

  async function shareLink() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "دعوت به فروشگاه اینترنتی فرش سَقَطچی",
          text: "با این لینک ثبت‌نام کن و از تخفیف ویژه استفاده کن!",
          url: inviteUrl,
        });
      } catch {
        // کاربر Share Sheet را بست — نیازی به خطا نیست.
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(inviteUrl);
      } catch {
        // بی‌صدا نادیده گرفته می‌شود.
      }
    }
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-black/5 bg-white p-4">
      <p className="mb-2 text-xs font-medium text-[var(--sf-ink)]/50">کد اختصاصی شما</p>
      <div className="flex items-center gap-2">
        <span
          dir="ltr"
          className="flex-1 rounded-[var(--radius-md)] bg-gray-100 px-3 py-2.5 text-center text-lg font-bold tracking-[0.2em] text-[var(--sf-ink)]"
        >
          {code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          aria-label={codeCopied ? "کد کپی شد" : "کپی کد"}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-gray-100 text-gray-500 active:bg-gray-200"
        >
          {codeCopied ? (
            <Check className="h-5 w-5 text-[var(--color-success)]" strokeWidth={2} aria-hidden="true" />
          ) : (
            <Copy className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </div>

      <button
        type="button"
        onClick={shareLink}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--sf-accent)] px-4 py-3 text-sm font-bold text-white active:bg-[var(--sf-accent-hover)]"
      >
        <Share2 className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        اشتراک‌گذاری لینک دعوت
      </button>
    </div>
  );
}
