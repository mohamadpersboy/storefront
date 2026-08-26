import { CouponsPageClient } from "@/components/coupons/coupons-page-client";

export default function CouponsPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">کدهای تخفیف</h1>
        <p className="mt-1 text-sm text-muted">
          مدیریت کدهای تخفیف عمومی و خصوصی (بند ۲۵-۲۶ Master Prompt)
        </p>
      </div>
      <CouponsPageClient />
    </div>
  );
}
