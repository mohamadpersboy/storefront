import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { otpVerifySchema } from "@/lib/validations/auth";
import { consumeOtp, OtpVerificationError } from "@/lib/auth/otp-flow";
import { createSessionToken, sessionCookieOptions } from "@/lib/auth/session";
import { User } from "@/models/User";

/**
 * تایید OTP و اعمال شماره موبایل جدید. چون `phoneNumber` داخل خود
 * توکن Session است (`SessionPayload`)، بعد از تغییر باید یک Session
 * تازه صادر و روی همان Cookie نوشته شود — وگرنه توکن قدیمی شماره
 * قبلی را نگه می‌داشت (نگاه کنید `lib/auth/session.ts`).
 *
 * چک تکراری‌نبودن شماره اینجا هم دوباره انجام می‌شود (نه فقط در
 * request-otp) چون بین آن دو درخواست، شخص دیگری می‌توانست همان
 * شماره را بگیرد؛ روی خطای Race Condition واقعی (کد ۱۱۰۰۰ Mongo)
 * هم جداگانه محافظت شده.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phoneNumber, code } = parsed.data;

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

  try {
    await consumeOtp(phoneNumber, code);
  } catch (error) {
    if (error instanceof OtpVerificationError) {
      return apiError(error.message, { status: error.status });
    }
    throw error;
  }

  const user = await User.findById(guard.user.id);
  if (!user) {
    return apiError("کاربر یافت نشد", { status: 404 });
  }

  user.phoneNumber = phoneNumber;
  try {
    await user.save();
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === 11000) {
      return apiError("این شماره قبلاً برای حساب دیگری ثبت شده است", { status: 409 });
    }
    throw error;
  }

  const token = await createSessionToken({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
  });

  const response = apiSuccess(
    { phoneNumber: user.phoneNumber },
    { message: "شماره موبایل با موفقیت تغییر کرد" },
  );
  response.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);

  return response;
}
