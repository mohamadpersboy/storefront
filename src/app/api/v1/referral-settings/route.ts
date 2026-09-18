import { connectToDatabase } from "@/lib/db/connect";
import { getReferralSettings } from "@/models/ReferralSettings";
import { Referral } from "@/models/Referral";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateReferralSettingsSchema } from "@/lib/validations/referral-settings";
import { logActivity } from "@/lib/audit/log-activity";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const settings = await getReferralSettings();

  // آمار کلی فقط‌خواندنی — به ادمین کمک می‌کند وضعیت واقعی سیستم را
  // بدون نیاز به یک صفحهٔ گزارش‌گیری جداگانه ببیند (Scope فعلی).
  const [totalReferrals, totalRewarded] = await Promise.all([
    Referral.countDocuments({}),
    Referral.countDocuments({ status: "rewarded" }),
  ]);

  return apiSuccess({
    enabled: settings.enabled,
    maxReferralsPerUser: settings.maxReferralsPerUser,
    rewardDiscountPercentage: settings.rewardDiscountPercentage,
    rewardMaxDiscountAmount: settings.rewardMaxDiscountAmount,
    minInviteeOrderAmount: settings.minInviteeOrderAmount,
    rewardCouponValidityDays: settings.rewardCouponValidityDays,
    totalReferrals,
    totalRewarded,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateReferralSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const settings = await getReferralSettings();
  Object.assign(settings, parsed.data);
  await settings.save();

  await logActivity({
    actor,
    action: "referral_settings.updated",
    targetType: "ReferralSettings",
    description: `تنظیمات دعوت دوستان ویرایش شد (${
      parsed.data.enabled
        ? `فعال، پاداش ${parsed.data.rewardDiscountPercentage.toLocaleString("fa-IR")}٪`
        : "غیرفعال"
    })`,
  });

  return apiSuccess(null, { message: "تنظیمات دعوت دوستان ذخیره شد" });
}
