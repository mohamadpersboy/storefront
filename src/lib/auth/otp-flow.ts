import { Otp } from "@/models/Otp";
import {
  generateOtpCode,
  hashOtpCode,
  verifyOtpHash,
  OTP_EXPIRY_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_MAX_ATTEMPTS,
} from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms/send-otp-sms";

const MAX_REQUESTS_PER_HOUR = 5;

/**
 * منطق صدور/مصرف OTP — قبلاً فقط داخل `auth/otp/request` و
 * `auth/otp/verify` (برای ورود) تکرار می‌شد؛ به اینجا منتقل شد تا
 * «تغییر شماره موبایل» (`account/phone/*`) هم همان قوانین دقیق
 * (Cooldown، سقف ساعتی، سقف تلاش نادرست) را بدون Duplicate Code
 * به ارث ببرد. رفتار دو Route قبلی عوض نشده — فقط پیاده‌سازی به
 * اینجا منتقل شده.
 */

export class OtpRateLimitError extends Error {}
export class OtpSendError extends Error {}

export class OtpVerificationError extends Error {
  status: 400 | 429;
  constructor(message: string, status: 400 | 429 = 400) {
    super(message);
    this.status = status;
  }
}

export async function issueOtp(
  phoneNumber: string,
  requestedIp?: string,
): Promise<{ expiresInSeconds: number }> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentOtps = await Otp.find({
    phoneNumber,
    createdAt: { $gte: oneHourAgo },
  })
    .sort({ createdAt: -1 })
    .limit(MAX_REQUESTS_PER_HOUR)
    .lean();

  // Resend cooldown: reject if the most recent request was too recent.
  const lastOtp = recentOtps[0];
  if (lastOtp) {
    const secondsSinceLast = (now.getTime() - new Date(lastOtp.createdAt).getTime()) / 1000;
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast);
      throw new OtpRateLimitError(`لطفاً ${waitSeconds} ثانیه دیگر دوباره تلاش کنید`);
    }
  }

  // Hourly abuse guard.
  if (recentOtps.length >= MAX_REQUESTS_PER_HOUR) {
    throw new OtpRateLimitError(
      "تعداد درخواست‌های شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
    );
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(phoneNumber, code);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);

  await Otp.create({ phoneNumber, codeHash, expiresAt, requestedIp });

  try {
    await sendOtpSms(phoneNumber, code);
  } catch (error) {
    console.error("Failed to send OTP SMS:", error);
    throw new OtpSendError("ارسال پیامک با خطا مواجه شد. دوباره تلاش کنید.");
  }

  return { expiresInSeconds: OTP_EXPIRY_SECONDS };
}

export async function consumeOtp(phoneNumber: string, code: string): Promise<void> {
  const now = new Date();
  const otp = await Otp.findOne({
    phoneNumber,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (!otp) {
    throw new OtpVerificationError("کد تأیید منقضی شده یا یافت نشد. دوباره درخواست دهید.", 400);
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    throw new OtpVerificationError("تعداد تلاش‌های مجاز به پایان رسیده. دوباره درخواست دهید.", 429);
  }

  const isValid = verifyOtpHash(phoneNumber, code, otp.codeHash);

  if (!isValid) {
    otp.attempts += 1;
    await otp.save();
    throw new OtpVerificationError("کد تأیید نادرست است", 400);
  }

  otp.consumedAt = now;
  await otp.save();
}
