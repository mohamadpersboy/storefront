import { connectToDatabase } from "@/lib/db/connect";
import { getTerms } from "@/models/Terms";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateTermsSchema } from "@/lib/validations/terms";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * عمداً بدون `requireApiUser`: هم Dashboard و هم صفحه «قوانین و
 * مقررات» Storefront به این محتوا نیاز دارند و داده حساسی نیست —
 * همان الگوی `GET /api/v1/about-us`.
 */
export async function GET() {
  await connectToDatabase();
  const doc = await getTerms();

  return apiSuccess({
    title: doc.title,
    content: doc.content,
  });
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateTermsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const doc = await getTerms();
  doc.title = parsed.data.title;
  doc.content = parsed.data.content;
  await doc.save();

  await logActivity({
    actor,
    action: "terms.updated",
    targetType: "Terms",
    description: "محتوای صفحه «قوانین و مقررات» ویرایش شد",
  });

  return apiSuccess(
    { title: doc.title, content: doc.content },
    { message: "قوانین و مقررات ذخیره شد" },
  );
}
