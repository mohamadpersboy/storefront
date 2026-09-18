import { Order } from "@/models/Order";
import { Coupon } from "@/models/Coupon";
import { Referral } from "@/models/Referral";
import { getReferralSettings } from "@/models/ReferralSettings";
import type { UserDocument } from "@/models/User";
import {
  generateUniqueReferralCode,
  generateUniqueReferralCouponCode,
} from "@/lib/referrals/generate-codes";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * بعد از هر سفارش موفق (`createOrder`) صدا زده می‌شود — کاملاً
 * Best-effort، دقیقاً هم‌الگو با `logActivity`/پیامک وضعیت سفارش:
 * شکست این تابع هرگز نباید سفارشی که تازه با موفقیت ثبت شده را
 * Fail کند؛ Caller این را در `try/catch` صدا می‌زند.
 *
 * دو کار مستقل انجام می‌دهد:
 *
 * ۱. **فعال‌سازی کد رفرال خودِ مشتری** — طبق تصمیم صریح کارفرما
 *    («کد رفرال کاربر بعد از اولین خریدش فعال می‌شود»)، کد فقط اینجا
 *    و فقط یک‌بار ساخته می‌شود؛ قبل از آن `User.referralCode` اصلاً
 *    وجود ندارد (نه یک Flag `isActive` جدا).
 *
 * ۲. **رسیدگی به پاداش دعوت‌کننده** — فقط اگر همین سفارش، اولین
 *    سفارش *واقعی* این مشتری باشد (شمارش سفارش‌های او دقیقاً ۱ شده)
 *    و او خودش با کد شخص دیگری ثبت‌نام کرده باشد. طبق درخواست صریح
 *    کارفرما: «به شرطی که اونها هم اولین خریدشون رو انجام داده
 *    باشن» — یعنی این تنها فرصت صدور پاداش است؛ سفارش‌های بعدی همان
 *    مشتری دیگر اثری روی رفرال ندارند.
 */
export async function processReferralEventsAfterOrder(
  customer: UserDocument,
  orderSubtotal: number,
): Promise<void> {
  if (!customer.referralCode) {
    customer.referralCode = await generateUniqueReferralCode();
    await customer.save();
  }

  if (!customer.referredBy) return;

  const orderCount = await Order.countDocuments({ customer: customer._id });
  if (orderCount !== 1) return; // این اولین سفارش این مشتری نیست — فرصت رفرال قبلاً مصرف/رد شده

  const referral = await Referral.findOne({ invitee: customer._id, status: "pending" });
  if (!referral) return; // قبلاً رسیدگی شده یا اصلاً رکوردی ثبت نشده

  const settings = await getReferralSettings();

  if (!settings.enabled) {
    referral.status = "ineligible";
    referral.firstOrderAmount = orderSubtotal;
    await referral.save();
    return;
  }

  if (orderSubtotal < settings.minInviteeOrderAmount) {
    referral.status = "ineligible";
    referral.firstOrderAmount = orderSubtotal;
    await referral.save();
    return;
  }

  if (settings.maxReferralsPerUser !== null) {
    const rewardedCount = await Referral.countDocuments({
      referrer: referral.referrer,
      status: "rewarded",
    });
    if (rewardedCount >= settings.maxReferralsPerUser) {
      referral.status = "ineligible";
      referral.firstOrderAmount = orderSubtotal;
      await referral.save();
      return;
    }
  }

  const code = await generateUniqueReferralCouponCode();
  const expiresAt = new Date(Date.now() + settings.rewardCouponValidityDays * MS_PER_DAY);

  const coupon = await Coupon.create({
    code,
    discountPercentage: settings.rewardDiscountPercentage,
    maxDiscountAmount: settings.rewardMaxDiscountAmount,
    minOrderAmount: 0,
    startsAt: null,
    expiresAt,
    status: "active",
    type: "private",
    allowedUsers: [referral.referrer],
    usageLimit: 1,
    perUserLimit: 1,
  });

  referral.status = "rewarded";
  referral.firstOrderAmount = orderSubtotal;
  referral.rewardCoupon = coupon._id;
  referral.rewardedAt = new Date();
  await referral.save();
}
