import { connectToDatabase } from "@/lib/db/connect";
import { getShippingSettings } from "@/models/ShippingSettings";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateShippingSettingsSchema } from "@/lib/validations/shipping-settings";
import { logActivity } from "@/lib/audit/log-activity";

export async function GET() {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;

  await connectToDatabase();
  const settings = await getShippingSettings();

  return apiSuccess({
    freeShippingEnabled: settings.freeShippingEnabled,
    freeShippingThreshold: settings.freeShippingThreshold,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateShippingSettingsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const settings = await getShippingSettings();
  Object.assign(settings, parsed.data);
  await settings.save();

  await logActivity({
    actor,
    action: "shipping_settings.updated",
    targetType: "ShippingSettings",
    description: `تنظیمات ارسال رایگان ویرایش شد (${
      parsed.data.freeShippingEnabled
        ? `فعال، آستانه ${parsed.data.freeShippingThreshold.toLocaleString("fa-IR")} تومان`
        : "غیرفعال"
    })`,
  });

  return apiSuccess(null, { message: "تنظیمات ارسال ذخیره شد" });
}
