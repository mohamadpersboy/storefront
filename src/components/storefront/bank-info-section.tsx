"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreditCard } from "lucide-react";
import { BankInfoCard } from "@/components/storefront/bank-info-card";
import { BankInfoForm, type BankInfoValues } from "@/components/storefront/bank-info-form";

export type SavedBankInfo = {
  ownerName: string;
  bankName: string | null;
  cardNumber: string | null;
  iban: string | null;
};

/**
 * سوییچ بین «کارت نمایشی» (وقتی رکورد ذخیره‌شده وجود دارد) و «فرم»
 * (اولین بار، یا وقتی کاربر روی «ویرایش» کارت زده). طبق درخواست
 * کارفرما: بعد از ذخیره، داده به‌صورت یک کارت نمایش داده شود، نه
 * یک فرم خالی/پرشده که دوباره باید Submit شود.
 */
export function BankInfoSection({
  initialData,
  defaultOwnerName,
}: {
  initialData: SavedBankInfo | null;
  defaultOwnerName?: string;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialData);
  const [mode, setMode] = useState<"view" | "edit">(saved ? "view" : "edit");
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm("اطلاعات بانکی حذف شود؟")) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/v1/account/bank-info", { method: "DELETE" });
      const body = await res.json();
      if (!res.ok || !body.success) return;
      setSaved(null);
      setMode("edit");
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  if (mode === "view" && saved) {
    return (
      <BankInfoCard
        ownerName={saved.ownerName}
        bankName={saved.bankName}
        cardNumber={saved.cardNumber}
        iban={saved.iban}
        onEdit={() => setMode("edit")}
        onDelete={handleDelete}
        deleting={deleting}
      />
    );
  }

  const formValues: BankInfoValues = {
    ownerName: saved?.ownerName ?? defaultOwnerName ?? "",
    bankName: saved?.bankName ?? "",
    cardNumber: saved?.cardNumber ?? "",
    iban: saved?.iban ?? "",
  };

  return (
    <>
      {!saved && (
        <div className="mx-4 mt-4 flex items-center gap-2 rounded-[var(--radius-lg)] border border-dashed border-black/10 bg-white px-4 py-3 text-xs text-[var(--sf-ink)]/50 sm:mx-6">
          <CreditCard className="size-4 shrink-0 text-[var(--color-primary)]" strokeWidth={1.75} aria-hidden="true" />
          هنوز اطلاعات بانکی ثبت نکرده‌اید.
        </div>
      )}
      <BankInfoForm
        initialValues={formValues}
        onCancel={saved ? () => setMode("view") : undefined}
        onSaved={(newData) => {
          setSaved(newData);
          setMode("view");
        }}
      />
    </>
  );
}
