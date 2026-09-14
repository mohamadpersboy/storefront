import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { otpRequestSchema } from "@/lib/validations/auth";
import { issueOtp, OtpRateLimitError, OtpSendError } from "@/lib/auth/otp-flow";
import { User } from "@/models/User";

/**
 * درخواست OTP برای تغییر شماره موبایل — همان `otpRequestSchema` و
 * همان `issueOtp` (Cooldown/سقف ساعتی) ورود، فقط این‌جا:
 * (۱) کاربر باید از قبل Login باشد، (۲) شماره باید متفاوت از شماره
 * فعلی باشد، (۳) شماره نباید قبلاً متعلق به کاربر دیگری باشد — این
 * دو چک فقط اینجا معنا دارند، نه در OTP ورود.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = otpRequestSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phoneNumber } = parsed.data;

  if (phoneNumber === guard.user.phoneNumber) {
    return apiError("این همان شماره موبایل فعلی شماست", { status: 422 });
  }

  await connectToDatabase();

  const existing = await User.findOne({
    phoneNumber,
    _id: { $ne: guard.user.id },
  }).lean();
  if (existing) {
    return apiError("این شماره قبلاً برای حساب دیگری ثبت شده است", { status: 409 });
  }

  const requestedIp =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  try {
    const result = await issueOtp(phoneNumber, requestedIp);
    return apiSuccess(result, { message: "کد تأیید ارسال شد" });
  } catch (error) {
    if (error instanceof OtpRateLimitError) {
      return apiError(error.message, { status: 429 });
    }
    if (error instanceof OtpSendError) {
      return apiError(error.message, { status: 502 });
    }
    throw error;
  }
}
