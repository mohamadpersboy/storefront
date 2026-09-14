"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, MapPinned, Pencil, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { getAddressDisplayTitle } from "@/lib/utils/address";
import type { AddressType } from "@/models/Address";

const TYPE_STYLES: Record<AddressType, { icon: typeof Home; badgeClassName: string }> = {
  home: { icon: Home, badgeClassName: "bg-emerald-50 text-emerald-600" },
  work: { icon: Briefcase, badgeClassName: "bg-blue-50 text-blue-600" },
  other: { icon: MapPinned, badgeClassName: "bg-violet-50 text-violet-600" },
};

/**
 * کارت هر آدرس در لیست «آدرس‌های من» — آیکون بر اساس نوع آدرس
 * (خانه/محل‌کار/سایر)، به‌همراه اقدامات سریع (ویرایش/حذف/تعیین
 * پیش‌فرض) مستقیم روی همین کارت، بدون نیاز به باز کردن فرم ویرایش
 * فقط برای حذف یا پیش‌فرض‌کردن.
 */
export function AddressListItem({
  id,
  addressType,
  customTitle,
  recipientName,
  phoneNumber,
  province,
  city,
  addressLine,
  isDefault,
}: {
  id: string;
  addressType: AddressType;
  customTitle: string | null;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { icon: Icon, badgeClassName } = TYPE_STYLES[addressType];
  const title = getAddressDisplayTitle({ addressType, customTitle });

  function handleDelete() {
    if (!window.confirm("این آدرس حذف شود؟")) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/addresses/${id}`, { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "حذف آدرس ممکن نشد");
        return;
      }
      router.refresh();
    });
  }

  function handleMakeDefault() {
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/v1/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) {
        setError(body.message ?? "تعیین آدرس پیش‌فرض ممکن نشد");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--radius-lg)] border bg-white transition-shadow",
        isDefault ? "border-[var(--color-primary)]/25 shadow-sm" : "border-black/5",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-md)]",
            badgeClassName,
          )}
        >
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[var(--sf-ink)]">{title}</p>
            {isDefault && (
              <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-bold text-[var(--color-primary)]">
                پیش‌فرض
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--sf-ink)]/60">
            {recipientName} — {phoneNumber}
          </p>
          <p className="mt-1 text-xs leading-5 text-[var(--sf-ink)]/50">
            {province}، {city}، {addressLine}
          </p>
        </div>
      </div>

      {error && <p className="px-4 pb-2 text-xs text-danger">{error}</p>}

      <div className="grid grid-cols-3 divide-x divide-x-reverse divide-black/5 border-t border-black/5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-red-600 active:bg-red-50 disabled:opacity-50"
        >
          <Trash2 className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          حذف
        </button>
        <Link
          href={`/account/addresses/${id}/edit`}
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[var(--sf-ink)]/70 active:bg-gray-50"
        >
          <Pencil className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
          ویرایش
        </Link>
        {isDefault ? (
          <span className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-gray-300">
            <Star className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            پیش‌فرض
          </span>
        ) : (
          <button
            type="button"
            onClick={handleMakeDefault}
            disabled={isPending}
            className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-[var(--color-primary)] active:bg-[var(--color-primary)]/5 disabled:opacity-50"
          >
            <Star className="size-3.5" strokeWidth={1.75} aria-hidden="true" />
            پیش‌فرض کن
          </button>
        )}
      </div>
    </div>
  );
}
