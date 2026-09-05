import { connectToDatabase } from "@/lib/db/connect";
import { Faq } from "@/models/Faq";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createFaqSchema } from "@/lib/validations/faqs";
import { logActivity } from "@/lib/audit/log-activity";

/**
 * عمداً بدون `requireApiUser`: هم Dashboard و هم صفحه «سوالات متداول»ی
 * آینده Storefront به این فهرست نیاز دارند و داده حساسی نیست — همان
 * الگوی `GET /api/v1/social-links`. فیلتر کردن به سوالات فعال (`isActive`)
 * وظیفه مصرف‌کننده (Storefront) است؛ Dashboard برای مدیریت به همه نیاز دارد.
 */
export async function GET() {
  await connectToDatabase();
  const faqs = await Faq.find().sort({ sortOrder: 1, createdAt: 1 }).lean();

  return apiSuccess(
    faqs.map((f) => ({
      id: String(f._id),
      question: f.question,
      answer: f.answer,
      isActive: f.isActive,
      sortOrder: f.sortOrder,
    })),
  );
}

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createFaqSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const faq = await Faq.create(parsed.data);

  await logActivity({
    actor,
    action: "faq.created",
    targetType: "Faq",
    targetId: faq.id,
    description: `سوال متداول جدید ثبت شد: «${faq.question}»`,
  });

  return apiSuccess(
    { id: faq.id, question: faq.question, answer: faq.answer },
    { message: "سوال متداول با موفقیت ساخته شد", status: 201 },
  );
}
