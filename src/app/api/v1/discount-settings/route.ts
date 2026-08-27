import { connectToDatabase } from "@/lib/db/connect";
import { getDiscountSettings } from "@/models/DiscountSettings";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateDiscountSettingsSchema } from "@/lib/validations/discount-settings";
import { logActivity } from "@/lib/audit/log-activity";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const settings = await getDiscountSettings();

  return apiSuccess({
    onlinePaymentRewardEnabled: settings.onlinePaymentRewardEnabled,
    onlinePaymentRewardPercentage: settings.onlinePaymentRewardPercentage,
    mixedPaymentRewardEnabled: settings.mixedPaymentRewardEnabled,
    mixedPaymentRewardPercentage: settings.mixedPaymentRewardPercentage,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateDiscountSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const settings = await getDiscountSettings();
  Object.assign(settings, parsed.data);
  await settings.save();

  await logActivity({
    actor,
    action: "discount_settings.updated",
    targetType: "DiscountSettings",
    description: `تنظیمات پاداش پرداخت ویرایش شد (آنلاین: ${
      parsed.data.onlinePaymentRewardEnabled ? `فعال ${parsed.data.onlinePaymentRewardPercentage}٪` : "غیرفعال"
    }، ترکیبی: ${
      parsed.data.mixedPaymentRewardEnabled ? `فعال ${parsed.data.mixedPaymentRewardPercentage}٪` : "غیرفعال"
    })`,
  });

  return apiSuccess(null, { message: "تنظیمات تخفیف پرداخت ذخیره شد" });
}
