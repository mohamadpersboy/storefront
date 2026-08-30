import { connectToDatabase } from "@/lib/db/connect";
import { getSocialLinks } from "@/models/SocialLinks";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateSocialLinksSchema } from "@/lib/validations/social-links";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * این Route عمداً بدون `requireApiUser` است: هم پنل Dashboard و هم در
 * آینده Storefront عمومی (فوتر سایت) به این اطلاعات نیاز دارند و هیچ‌کدام
 * داده حساسی نیستند (فقط لینک‌های عمومی شبکه‌های اجتماعی فروشگاه). این
 * اولین Route عمومی (بدون Auth) پروژه است — طبق یافته Phase 1 Audit،
 * لایه API عمومی برای Storefront باید همین‌جا شروع شود.
 */
export async function GET() {
  await connectToDatabase();
  const doc = await getSocialLinks();

  return apiSuccess({
    links: doc.links.map((l) => ({
      platform: l.platform,
      url: l.url,
      isActive: l.isActive,
    })),
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateSocialLinksSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const doc = await getSocialLinks();
  doc.links = parsed.data.links;
  await doc.save();

  const activeCount = parsed.data.links.filter((l) => l.isActive).length;
  await logActivity({
    actor,
    action: "social_links.updated",
    targetType: "SocialLinks",
    description: `تنظیمات شبکه‌های اجتماعی ویرایش شد (${activeCount} شبکه فعال)`,
  });

  return apiSuccess(
    { links: doc.links },
    { message: "لینک‌های شبکه‌های اجتماعی ذخیره شد" },
  );
}
