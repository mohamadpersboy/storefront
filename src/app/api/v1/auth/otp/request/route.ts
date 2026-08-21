import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Otp } from "@/models/Otp";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { otpRequestSchema } from "@/lib/validations/auth";
import {
  generateOtpCode,
  hashOtpCode,
  OTP_EXPIRY_SECONDS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "@/lib/auth/otp";
import { sendOtpSms } from "@/lib/sms/send-otp-sms";

const MAX_REQUESTS_PER_HOUR = 5;

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phoneNumber } = parsed.data;
  await connectToDatabase();

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
    const secondsSinceLast =
      (now.getTime() - new Date(lastOtp.createdAt).getTime()) / 1000;
    if (secondsSinceLast < OTP_RESEND_COOLDOWN_SECONDS) {
      const waitSeconds = Math.ceil(
        OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLast,
      );
      return apiError(
        `لطفاً ${waitSeconds} ثانیه دیگر دوباره تلاش کنید`,
        { status: 429 },
      );
    }
  }

  // Hourly abuse guard.
  if (recentOtps.length >= MAX_REQUESTS_PER_HOUR) {
    return apiError(
      "تعداد درخواست‌های شما بیش از حد مجاز است. کمی بعد دوباره تلاش کنید.",
      { status: 429 },
    );
  }

  const code = generateOtpCode();
  const codeHash = hashOtpCode(phoneNumber, code);
  const expiresAt = new Date(now.getTime() + OTP_EXPIRY_SECONDS * 1000);
  const requestedIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    undefined;

  await Otp.create({ phoneNumber, codeHash, expiresAt, requestedIp });

  try {
    await sendOtpSms(phoneNumber, code);
  } catch (error) {
    console.error("Failed to send OTP SMS:", error);
    return apiError("ارسال پیامک با خطا مواجه شد. دوباره تلاش کنید.", {
      status: 502,
    });
  }

  return apiSuccess(
    { expiresInSeconds: OTP_EXPIRY_SECONDS },
    { message: "کد تأیید ارسال شد" },
  );
}
