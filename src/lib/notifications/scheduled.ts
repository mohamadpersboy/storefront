import { AmazingOffer } from "@/models/AmazingOffer";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";
import { Notification } from "@/models/Notification";
import { DAILY_SPECIAL_OFFER_TTL_HOURS, type NotificationConfig } from "./config";
import { DAILY_SPECIAL_OFFER_KEY_PREFIX, dedupeKeys } from "./dedupe";
import { buildCouponExpiryReminder } from "./events";
import { NOTIFICATION_LINKS } from "./links-map";
import { createNotification, createNotifications, type NewNotification } from "./service";
import { dailySpecialOfferText } from "./templates";
import { hasReachedLocalTime, localDateKey } from "./timezone";

const MS_PER_HOUR = 60 * 60 * 1000;
/** سقف Couponهای پردازش‌شده در هر اجرا؛ بقیه در اجرای بعدی می‌آیند. */
const COUPON_BATCH_SIZE = 200;

export type DailySpecialOfferResult =
  | { status: "not_due" }
  | { status: "already_ran" }
  | { status: "no_new_offers" }
  | { status: "created"; productCount: number }
  | { status: "duplicate" };

/**
 * اعلان روزانه «پیشنهاد شگفت‌انگیز» (منطق Business اینجاست؛ Route کران
 * فقط صدایش می‌زند).
 *
 * - Trigger: تعداد **محصولات** فعالی که AmazingOffer آن‌ها از آخرین
 *   اعلان روزانه به بعد ساخته شده (`createdAt` — نه تعداد فعلی کل).
 * - اگر صفر بود اعلان ساخته نمی‌شود؛ چون مبنا «آخرین اعلانِ ساخته‌شده»
 *   است، Offerهای آن روز در اجرای بعدی حساب می‌شوند (جبران).
 * - اجرای دوباره در همان روز محلی: `dedupeKey` روزانه از تکرار جلوگیری می‌کند.
 * - قبل از ساعت تنظیم‌شده اجرا شود، هیچ‌کاری نمی‌کند (`not_due`).
 */
export async function runDailySpecialOfferNotification(
  now: Date,
  config: NotificationConfig,
): Promise<DailySpecialOfferResult> {
  if (
    !hasReachedLocalTime(now, config.timeZone, config.specialOfferHour, config.specialOfferMinute)
  ) {
    return { status: "not_due" };
  }

  const dedupeKey = dedupeKeys.dailySpecialOffer(localDateKey(now, config.timeZone));
  if (await Notification.exists({ dedupeKey })) return { status: "already_ran" };

  const last = await Notification.findOne({
    dedupeKey: { $regex: `^${DAILY_SPECIAL_OFFER_KEY_PREFIX}` },
  })
    .sort({ createdAt: -1 })
    .select("createdAt")
    .lean();
  const windowStart = last?.createdAt ?? new Date(now.getTime() - 24 * MS_PER_HOUR);

  const productIds = await AmazingOffer.distinct("productId", {
    createdAt: { $gt: windowStart, $lte: now },
    isActive: true,
    endAt: { $gt: now },
  });
  if (productIds.length === 0) return { status: "no_new_offers" };

  const result = await createNotification({
    audience: "public",
    type: "special_offer",
    ...dailySpecialOfferText(productIds.length),
    link: NOTIFICATION_LINKS.specialOffers,
    publishAt: now,
    expiresAt: new Date(now.getTime() + DAILY_SPECIAL_OFFER_TTL_HOURS * MS_PER_HOUR),
    dedupeKey,
  });
  return result.created
    ? { status: "created", productCount: productIds.length }
    : { status: "duplicate" };
}

/**
 * یادآوری انقضای کد تخفیف **اختصاصی**: Coupon فعالِ شروع‌شده و هنوز
 * منقضی‌نشده که کمتر از `couponExpiryReminderHours` به انقضایش مانده؛
 * فقط برای کاربرانی که آن را مصرف نکرده‌اند. `dedupeKey` (کوپن+کاربر+ساعت)
 * از یادآوری تکراری جلوگیری می‌کند. برای Coupon منقضی هرگز ساخته نمی‌شود.
 */
export async function runCouponExpiryReminders(
  now: Date,
  config: NotificationConfig,
): Promise<{ coupons: number; created: number }> {
  const hours = config.couponExpiryReminderHours;
  const cutoff = new Date(now.getTime() + hours * MS_PER_HOUR);

  const coupons = await Coupon.find({
    type: "private",
    status: "active",
    expiresAt: { $gt: now, $lte: cutoff },
    $or: [{ startsAt: null }, { startsAt: { $lte: now } }],
  })
    .sort({ expiresAt: 1 })
    .limit(COUPON_BATCH_SIZE)
    .lean();

  let created = 0;

  for (const coupon of coupons) {
    // ظرفیت کل تمام شده = مصرف‌شده؛ یادآوری معنی ندارد.
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) continue;
    if (coupon.allowedUsers.length === 0) continue;

    const redemptions = await CouponRedemption.aggregate<{ _id: unknown; n: number }>([
      { $match: { coupon: coupon._id } },
      { $group: { _id: "$user", n: { $sum: 1 } } },
    ]);
    const usedCounts = new Map(redemptions.map((r) => [String(r._id), r.n]));
    const perUserLimit = coupon.perUserLimit ?? 1;

    const inputs: NewNotification[] = coupon.allowedUsers
      .filter((userId) => (usedCounts.get(String(userId)) ?? 0) < perUserLimit)
      .map((userId) =>
        buildCouponExpiryReminder({
          coupon: { ...coupon, id: coupon._id },
          userId,
          hours,
        }),
      );

    created += (await createNotifications(inputs)).created;
  }

  return { coupons: coupons.length, created };
}

export interface ScheduledRunResult {
  specialOffer: DailySpecialOfferResult;
  couponExpiry: { coupons: number; created: number };
}

/** ورودی تنهای Route کران: هر دو کار زمان‌بندی‌شده را اجرا می‌کند. */
export async function runScheduledNotifications(
  now: Date,
  config: NotificationConfig,
): Promise<ScheduledRunResult> {
  const specialOffer = await runDailySpecialOfferNotification(now, config);
  const couponExpiry = await runCouponExpiryReminders(now, config);
  return { specialOffer, couponExpiry };
}
