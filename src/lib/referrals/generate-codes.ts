import { User } from "@/models/User";
import { Coupon } from "@/models/Coupon";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // بدون حروف/عدد گیج‌کننده (O/0, I/1)
const REFERRAL_CODE_LENGTH = 6;
const MAX_ATTEMPTS = 10;

function randomCode(length: number): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

/**
 * یک کد رفرال یکتای جدید برای کاربر تولید می‌کند — با بررسی
 * Uniqueness واقعی در DB (نه صرفاً یک رشته تصادفی امیدوارانه)، هم‌الگو
 * با روحیهٔ `generateCandidateCouponCode` + بررسی در‌دسترس‌بودن.
 * پرتاب خطا فقط در حالت بسیار بعید تصادم مکرر (که عملاً هرگز رخ
 * نمی‌دهد با این طول Alphabet).
 */
export async function generateUniqueReferralCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = randomCode(REFERRAL_CODE_LENGTH);
    const exists = await User.exists({ referralCode: candidate });
    if (!exists) return candidate;
  }
  throw new Error("امکان تولید کد رفرال یکتا وجود نداشت");
}

/**
 * کد یکتای کوپن پاداش رفرال — پیشوند «REF» تا در گزارش‌های Dashboard
 * از کدهای تخفیف دستی ادمین قابل تشخیص باشد؛ Uniqueness واقعی در
 * `Coupon` بررسی می‌شود (نه فقط `check-code` که مخصوص فرم دستی است).
 */
export async function generateUniqueReferralCouponCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const candidate = `REF${randomCode(5)}`;
    const exists = await Coupon.exists({ code: candidate });
    if (!exists) return candidate;
  }
  throw new Error("امکان تولید کد کوپن پاداش یکتا وجود نداشت");
}
