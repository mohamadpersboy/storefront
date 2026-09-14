"use client";

import { useState } from "react";
import { Landmark, Eye, EyeOff, Copy, Check, Pencil, Trash2, User } from "lucide-react";
import { cn } from "@/lib/utils/cn";

function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length !== 16) return cardNumber;
  return `${cardNumber.slice(0, 4)}  ••••  ••••  ${cardNumber.slice(-4)}`;
}

function groupCardNumber(cardNumber: string): string {
  return cardNumber.replace(/(\d{4})(?=\d)/g, "$1  ");
}

function CopyButton({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // کپی خودکار در برخی مرورگرها بدون HTTPS/تعامل کاربر ممکن است
      // شکست بخورد — چیزی مهم‌تر از خود عدد از دست نمی‌رود، پس فقط
      // بی‌صدا نادیده گرفته می‌شود؛ کاربر می‌تواند دستی انتخاب کند.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] bg-gray-100 py-2.5 text-xs font-bold text-[var(--sf-ink)]/70 active:bg-gray-200"
    >
      {copied ? (
        <Check className="size-3.5 text-emerald-600" strokeWidth={2} aria-hidden="true" />
      ) : (
        <Copy className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
      )}
      {copied ? "کپی شد" : label}
    </button>
  );
}

/**
 * کارت نمایشی اطلاعات بانکی ذخیره‌شده — الهام‌گرفته از یک کارت
 * بانکی واقعی (رفرنس بصری کارفرما) اما نه کپی دقیق آن: پس‌زمینه
 * گرادیانی، دکمه چشم برای نمایش/مخفی‌کردن شماره کامل، و دکمه‌های
 * کپی مجزا برای شماره کارت/شبا.
 */
export function BankInfoCard({
  ownerName,
  bankName,
  cardNumber,
  iban,
  onEdit,
  onDelete,
  deleting,
}: {
  ownerName: string;
  bankName: string | null;
  cardNumber: string | null;
  iban: string | null;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="space-y-3 px-4 py-4 sm:px-6">
      <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-slate-800 via-slate-900 to-black p-5 text-white shadow-lg">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-10 -top-10 size-40 rounded-full bg-white/5"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-14 -right-6 size-40 rounded-full bg-white/5"
        />

        <div className="relative flex items-center justify-between">
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            aria-label={revealed ? "مخفی کردن شماره" : "نمایش شماره"}
            className="flex size-9 items-center justify-center rounded-full bg-white/10 backdrop-blur active:bg-white/20"
          >
            {revealed ? (
              <EyeOff className="size-4" strokeWidth={1.75} aria-hidden="true" />
            ) : (
              <Eye className="size-4" strokeWidth={1.75} aria-hidden="true" />
            )}
          </button>
          <div className="flex items-center gap-1.5 text-sm font-bold text-white/90">
            {bankName || "کارت بانکی من"}
            <Landmark className="size-4" strokeWidth={1.75} aria-hidden="true" />
          </div>
        </div>

        {cardNumber && (
          <p dir="ltr" className="relative mt-8 text-center font-mono text-xl tracking-widest">
            {revealed ? groupCardNumber(cardNumber) : maskCardNumber(cardNumber)}
          </p>
        )}

        {!cardNumber && iban && (
          <p dir="ltr" className="relative mt-8 text-center font-mono text-base tracking-wide">
            {revealed ? iban : `${iban.slice(0, 4)} •••••••••••••••••••• ${iban.slice(-4)}`}
          </p>
        )}

        <div className="relative mt-6 flex items-center gap-1.5 text-xs text-white/60">
          <User className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          دارنده حساب
        </div>
        <p className="relative text-sm font-bold">{ownerName}</p>
      </div>

      <div className={cn("grid gap-2", cardNumber && iban ? "grid-cols-2" : "grid-cols-1")}>
        {cardNumber && <CopyButton label="کپی شماره کارت" value={cardNumber} />}
        {iban && <CopyButton label="کپی شبا" value={iban} />}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-black/5 bg-white py-2.5 text-xs font-bold text-[var(--sf-ink)]/70 active:bg-gray-50"
        >
          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          ویرایش
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={deleting}
          className="flex items-center justify-center gap-1.5 rounded-[var(--radius-md)] border border-red-100 bg-red-50 py-2.5 text-xs font-bold text-red-600 active:bg-red-100 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          {deleting ? "…" : "حذف"}
        </button>
      </div>
    </div>
  );
}
