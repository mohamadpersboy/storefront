import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { claimFirstAdminSlot } from "@/models/SystemFlag";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { otpVerifySchema } from "@/lib/validations/auth";
import { consumeOtp, OtpVerificationError } from "@/lib/auth/otp-flow";
import { attachReferrerOnSignup } from "@/lib/referrals/attach-referrer-on-signup";
import {
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { ROLES } from "@/lib/constants/rbac";

export async function POST(request: NextRequest) {
  const json = await request.json().catch(() => null);
  const parsed = otpVerifySchema.safeParse(json);

  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { phoneNumber, code, referralCode } = parsed.data;
  await connectToDatabase();

  try {
    await consumeOtp(phoneNumber, code);
  } catch (error) {
    if (error instanceof OtpVerificationError) {
      return apiError(error.message, { status: error.status });
    }
    throw error;
  }

  const now = new Date();
  let user = await User.findOne({ phoneNumber });

  if (!user) {
    const isFirstAdmin = await claimFirstAdminSlot();
    user = await User.create({
      phoneNumber,
      role: isFirstAdmin ? ROLES.SUPER_ADMIN : ROLES.CUSTOMER,
    });

    try {
      await attachReferrerOnSignup(user, referralCode);
    } catch (error) {
      // Best-effort — یک مشکل در اتصال رفرال هرگز نباید ثبت‌نام/ورود
      // یک کاربر تازه را Fail کند.
      console.error("Failed to attach referrer on signup:", error);
    }
  }

  if (!user.isActive) {
    return apiError("حساب کاربری شما غیرفعال شده است", { status: 403 });
  }

  user.lastLoginAt = now;
  await user.save();

  const token = await createSessionToken({
    userId: user.id,
    phoneNumber: user.phoneNumber,
    role: user.role,
  });

  const response = apiSuccess(
    {
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.fullName ?? null,
        role: user.role,
      },
    },
    { message: "ورود با موفقیت انجام شد" },
  );

  response.cookies.set(sessionCookieOptions.name, token, sessionCookieOptions);

  return response;
}
