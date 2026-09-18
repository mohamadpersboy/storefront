import { User, type UserDocument } from "@/models/User";
import { Referral } from "@/models/Referral";
import { getReferralSettings } from "@/models/ReferralSettings";

/**
 * فقط برای کاربری که همین لحظه (اولین‌بار) در `POST
 * /api/v1/auth/otp/verify` ساخته شده صدا زده می‌شود. کاملاً
 * Best-effort — یک کد رفرال نامعتبر یا هر خطای دیگر اینجا هرگز نباید
 * جلوی ورود موفق کاربر را بگیرد (Caller این را در `try/catch` صدا
 * می‌زند).
 *
 * قوانین:
 * - کد رفرال نامعتبر/متعلق به خودِ همین کاربر → بی‌صدا نادیده گرفته
 *   می‌شود (نه خطا به کاربر جدید).
 * - اگر سیستم رفرال در تنظیمات غیرفعال باشد، هیچ اتصالی ثبت نمی‌شود.
 * - سقف «حداکثر تعداد دعوت هر نفر» همینجا، در لحظهٔ ثبت‌نام، اعمال
 *   می‌شود — نه در لحظهٔ صدور پاداش؛ یعنی این سقف روی *تعداد
 *   دعوت‌های ثبت‌شده* است، نه فقط تعداد پاداش‌های دریافتی.
 */
export async function attachReferrerOnSignup(
  newUser: UserDocument,
  referralCodeInput?: string,
): Promise<void> {
  if (!referralCodeInput) return;

  const code = referralCodeInput.trim().toUpperCase();
  const referrer = await User.findOne({ referralCode: code });
  if (!referrer) return;
  if (String(referrer._id) === String(newUser._id)) return; // نباید عملاً رخ دهد؛ محافظه‌کارانه

  const settings = await getReferralSettings();
  if (!settings.enabled) return;

  if (settings.maxReferralsPerUser !== null) {
    const totalReferred = await Referral.countDocuments({ referrer: referrer._id });
    if (totalReferred >= settings.maxReferralsPerUser) return;
  }

  newUser.referredBy = referrer._id;
  await newUser.save();

  await Referral.create({
    referrer: referrer._id,
    invitee: newUser._id,
    code,
    status: "pending",
  });
}
