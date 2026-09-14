"use client";

import Link from "next/link";
import { MapPin, Pencil } from "lucide-react";

export function AddressListItem({
  id,
  title,
  recipientName,
  phoneNumber,
  province,
  city,
  addressLine,
  isDefault,
}: {
  id: string;
  title: string;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  isDefault: boolean;
}) {
  return (
    <Link
      href={`/account/addresses/${id}/edit`}
      className="block rounded-[var(--radius-lg)] border border-black/5 bg-white p-4 active:bg-gray-50"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-emerald-50 text-emerald-600">
          <MapPin className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-[var(--sf-ink)]">{title}</p>
            {isDefault && (
              <span className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]">
                پیش‌فرض
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--sf-ink)]/60">
            {recipientName} — {phoneNumber}
          </p>
          <p className="mt-1 truncate text-xs text-[var(--sf-ink)]/50">
            {province}، {city}، {addressLine}
          </p>
        </div>
        <Pencil className="size-4 shrink-0 text-gray-300" strokeWidth={1.75} aria-hidden="true" />
      </div>
    </Link>
  );
}
