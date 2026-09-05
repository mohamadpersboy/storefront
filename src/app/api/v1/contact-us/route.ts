import { connectToDatabase } from "@/lib/db/connect";
import { getContactUs } from "@/models/ContactUs";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateContactUsSchema } from "@/lib/validations/contact-us";
import { logActivity } from "@/lib/audit/log-activity";

function serialize(doc: Awaited<ReturnType<typeof getContactUs>>) {
  return {
    phone: doc.phone,
    secondaryPhone: doc.secondaryPhone,
    email: doc.email,
    address: doc.address,
    workingHours: doc.workingHours,
    latitude: doc.latitude,
    longitude: doc.longitude,
  };
}

/**
 * عمداً بدون `requireApiUser`: هم Dashboard و هم فوتر/صفحه «تماس با ما»ی
 * آینده Storefront به این اطلاعات نیاز دارند و داده حساسی نیست — همان
 * الگوی `GET /api/v1/social-links`.
 */
export async function GET() {
  await connectToDatabase();
  const doc = await getContactUs();
  return apiSuccess(serialize(doc));
}

export async function PATCH(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = updateContactUsSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const doc = await getContactUs();
  Object.assign(doc, parsed.data);
  await doc.save();

  await logActivity({
    actor,
    action: "contact_us.updated",
    targetType: "ContactUs",
    description: "اطلاعات صفحه «تماس با ما» ویرایش شد",
  });

  return apiSuccess(serialize(doc), { message: "اطلاعات تماس با ما ذخیره شد" });
}
