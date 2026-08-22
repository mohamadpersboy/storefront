import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Otp } from "@/models/Otp";
import { User } from "@/models/User";
import { claimFirstAdminSlot } from "@/models/SystemFlag";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { otpVerifySchema } from "@/lib/validations/auth";
import { OTP_MAX_ATTEMPTS, verifyOtpHash } from "@/lib/auth/otp";
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

  const { phoneNumber, code } = parsed.data;
  await connectToDatabase();

  const now = new Date();
  const otp = await Otp.findOne({
    phoneNumber,
    consumedAt: null,
    expiresAt: { $gt: now },
  }).sort({ createdAt: -1 });

  if (!otp) {
    return apiError("کد تأیید منقضی شده یا یافت نشد. دوباره درخواست دهید.", {
      status: 400,
    });
  }

  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    return apiError("تعداد تلاش‌های مجاز به پایان رسیده. دوباره درخواست دهید.", {
      status: 429,
    });
  }

  const isValid = verifyOtpHash(phoneNumber, code, otp.codeHash);

  if (!isValid) {
    otp.attempts += 1;
    await otp.save();
    return apiError("کد تأیید نادرست است", { status: 400 });
  }

  otp.consumedAt = now;
  await otp.save();

  let user = await User.findOne({ phoneNumber });

  if (!user) {
    const isFirstAdmin = await claimFirstAdminSlot();
    user = await User.create({
      phoneNumber,
      role: isFirstAdmin ? ROLES.SUPER_ADMIN : ROLES.CUSTOMER,
    });
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
