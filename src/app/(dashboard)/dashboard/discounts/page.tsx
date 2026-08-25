import { DiscountsPageClient } from "@/components/discounts/discounts-page-client";

export default function DiscountsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">تخفیف‌ها</h1>
        <p className="mt-1 text-sm text-muted">
          نمای کلی محصولاتی که حداقل یک Variant تخفیف‌دار دارند. برای ویرایش تخفیف هر
          Variant وارد فرم ویرایش همان محصول شوید.
        </p>
      </div>
      <DiscountsPageClient />
    </div>
  );
}
