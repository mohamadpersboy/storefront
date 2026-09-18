import { connectToDatabase } from "@/lib/db/connect";
import { Referral, type ReferralStatus } from "@/models/Referral";
import { Coupon } from "@/models/Coupon";
import type { Types } from "mongoose";

export type ReferralInviteeSummary = {
  id: string;
  displayName: string;
  status: ReferralStatus;
  createdAt: string;
};

export type ReferralPageData = {
  /** `null` یعنی هنوز اولین خرید خودِ کاربر کامل نشده — کد رفرال هنوز وجود ندارد. */
  referralCode: string | null;
  pendingCount: number;
  rewardedCount: number;
  totalCount: number;
  invitees: ReferralInviteeSummary[];
  /** کدهای تخفیف پاداشی که هنوز مصرف نشده‌اند (برای نمایش/کپی به کاربر). */
  activeRewardCoupons: Array<{ code: string; discountPercentage: number; expiresAt: string }>;
};

type LeanInvitee = { _id: Types.ObjectId; fullName?: string; phoneNumber: string };

type LeanReferral = {
  _id: Types.ObjectId;
  status: ReferralStatus;
  createdAt: Date;
  rewardCoupon: Types.ObjectId | null;
  invitee: LeanInvitee | Types.ObjectId | null;
};

/** شمارهٔ موبایل را برای نمایش عمومی جزئی می‌پوشاند (مثلاً 0912***4321). */
function maskPhoneNumber(phoneNumber: string): string {
  if (phoneNumber.length < 7) return phoneNumber;
  return `${phoneNumber.slice(0, 4)}***${phoneNumber.slice(-4)}`;
}

export async function getReferralPageData(
  userId: string,
  referralCode: string | null,
): Promise<ReferralPageData> {
  await connectToDatabase();

  const referrals = (await Referral.find({ referrer: userId })
    .sort({ createdAt: -1 })
    .populate({ path: "invitee", select: "fullName phoneNumber" })
    .lean()) as unknown as LeanReferral[];

  const pendingCount = referrals.filter((r) => r.status === "pending").length;
  const rewardedCount = referrals.filter((r) => r.status === "rewarded").length;

  const invitees: ReferralInviteeSummary[] = referrals
    .filter(
      (r): r is LeanReferral & { invitee: LeanInvitee } =>
        !!r.invitee && typeof r.invitee === "object" && "phoneNumber" in r.invitee,
    )
    .map((r) => ({
      id: String(r._id),
      displayName: r.invitee.fullName?.trim() || maskPhoneNumber(r.invitee.phoneNumber),
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

  const rewardCouponIds = referrals
    .filter((r) => r.status === "rewarded" && r.rewardCoupon)
    .map((r) => r.rewardCoupon);

  const activeRewardCoupons =
    rewardCouponIds.length > 0
      ? await Coupon.find({
          _id: { $in: rewardCouponIds },
          status: "active",
          usedCount: 0,
          expiresAt: { $gt: new Date() },
        })
          .select("code discountPercentage expiresAt")
          .sort({ createdAt: -1 })
          .lean()
      : [];

  return {
    referralCode,
    pendingCount,
    rewardedCount,
    totalCount: referrals.length,
    invitees,
    activeRewardCoupons: activeRewardCoupons.map((c) => ({
      code: c.code,
      discountPercentage: c.discountPercentage,
      expiresAt: c.expiresAt.toISOString(),
    })),
  };
}
