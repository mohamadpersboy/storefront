import { connectToDatabase } from "@/lib/db/connect";
import { getAboutUs } from "@/models/AboutUs";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateAboutUsSchema } from "@/lib/validations/about-us";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * عمداً بدون `requireApiUser`: هم Dashboard و هم بخش «درباره ما» آینده
 * Storefront به این محتوا نیاز دارند و داده حساسی نیست — همان الگوی
 * `GET /api/v1/social-links`.
 */
export async function GET() {
  await connectToDatabase();
  const doc = await getAboutUs();

  return apiSuccess({
    title: doc.title,
    content: doc.content,
    imageUrl: doc.imageUrl,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateAboutUsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const doc = await getAboutUs();
  doc.title = parsed.data.title;
  doc.content = parsed.data.content;
  doc.imageUrl = parsed.data.imageUrl;
  await doc.save();

  await logActivity({
    actor,
    action: "about_us.updated",
    targetType: "AboutUs",
    description: "محتوای صفحه «درباره ما» ویرایش شد",
  });

  return apiSuccess(
    { title: doc.title, content: doc.content, imageUrl: doc.imageUrl },
    { message: "محتوای درباره ما ذخیره شد" },
  );
}
