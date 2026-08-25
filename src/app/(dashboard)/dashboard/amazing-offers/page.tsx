import { AmazingOffersPageClient } from "@/components/amazing-offers/amazing-offers-page-client";

export default function AmazingOffersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">تخفیف‌های شگفت‌انگیز</h1>
        <p className="mt-1 text-sm text-muted">
          مدیریت Offerهای زمان‌بندی‌شده روی Variantهای محصولات (بند ۲۵ Master Prompt)
        </p>
      </div>
      <AmazingOffersPageClient />
    </div>
  );
}
