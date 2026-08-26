import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CouponForm } from "@/components/coupons/coupon-form";
import { connectToDatabase } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const coupon = await Coupon.findById(id)
    .populate({ path: "allowedUsers", select: "fullName phoneNumber" })
    .lean()
    .catch(() => null);

  if (!coupon) {
    notFound();
  }

  const allowedUsers = coupon.allowedUsers as unknown as Array<{
    _id: unknown;
    fullName?: string;
    phoneNumber: string;
  }>;

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/coupons"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست
      </Link>
      <CouponForm
        initial={{
          id: String(coupon._id),
          code: coupon.code,
          discountPercentage: coupon.discountPercentage,
          maxDiscountAmount: coupon.maxDiscountAmount,
          minOrderAmount: coupon.minOrderAmount,
          startsAt: coupon.startsAt ? coupon.startsAt.toISOString() : null,
          expiresAt: coupon.expiresAt.toISOString(),
          status: coupon.status,
          type: coupon.type,
          allowedUsers: allowedUsers.map((u) => ({
            id: String(u._id),
            fullName: u.fullName ?? null,
            phoneNumber: u.phoneNumber,
          })),
          usageLimit: coupon.usageLimit,
          perUserLimit: coupon.perUserLimit,
        }}
      />
    </div>
  );
}
