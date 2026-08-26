import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CouponForm } from "@/components/coupons/coupon-form";

export default function NewCouponPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/coupons"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <CouponForm />
    </div>
  );
}
