import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { validateCouponEligibility } from "@/lib/discounts/validate-coupon";
import { computeCouponDiscount } from "@/lib/discounts/engine";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const bodySchema = z.object({
  code: z.string().trim().min(1),
  customerId: z.string().regex(objectIdRegex),
  eligibleAmount: z.number().min(0),
});

/**
 * Read-only preview used by the order-creation form so staff get
 * immediate feedback on a coupon code — it never reserves usage or
 * touches usedCount. The actual, authoritative check + reservation
 * happens again inside POST /api/v1/orders regardless of what this
 * endpoint returned, since Client-reported validity is never trusted
 * (§44).
 */
export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.ORDERS_UPDATE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", { status: 422 });
  }

  await connectToDatabase();
  const { code, customerId, eligibleAmount } = parsed.data;

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon) {
    return apiError("کد تخفیف یافت نشد", { status: 404 });
  }

  const usedByUserCount = await CouponRedemption.countDocuments({
    coupon: coupon._id,
    user: customerId,
  });

  const eligibility = validateCouponEligibility({
    coupon: {
      code: coupon.code,
      status: coupon.status,
      type: coupon.type,
      minOrderAmount: coupon.minOrderAmount,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      usageLimit: coupon.usageLimit,
      usedCount: coupon.usedCount,
      perUserLimit: coupon.perUserLimit,
      allowedUserIds: coupon.allowedUsers.map(String),
    },
    userId: customerId,
    eligibleAmount,
    usedByUserCount,
  });

  if (!eligibility.valid) {
    return apiError(eligibility.reason, { status: 422 });
  }

  const discountAmount = computeCouponDiscount(
    eligibleAmount,
    coupon.discountPercentage,
    coupon.maxDiscountAmount,
  );

  return apiSuccess({
    code: coupon.code,
    discountPercentage: coupon.discountPercentage,
    discountAmount,
  });
}
