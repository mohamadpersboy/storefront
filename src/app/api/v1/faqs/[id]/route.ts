import { connectToDatabase } from "@/lib/db/connect";
import { Faq } from "@/models/Faq";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateFaqSchema } from "@/lib/validations/faqs";
import { logActivity } from "@/lib/audit/log-activity";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateFaqSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const faq = await Faq.findById(id);
  if (!faq) {
    return apiError("سوال متداول یافت نشد", { status: 404 });
  }

  Object.assign(faq, parsed.data);
  await faq.save();

  await logActivity({
    actor,
    action: "faq.updated",
    targetType: "Faq",
    targetId: faq.id,
    description: `سوال متداول ویرایش شد: «${faq.question}»`,
  });

  return apiSuccess(
    { id: faq.id, question: faq.question, answer: faq.answer },
    { message: "سوال متداول ویرایش شد" },
  );
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const guard = await requireApiUser(PERMISSIONS.SETTINGS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  await connectToDatabase();

  const faq = await Faq.findById(id);
  if (!faq) {
    return apiError("سوال متداول یافت نشد", { status: 404 });
  }

  await faq.deleteOne();

  await logActivity({
    actor,
    action: "faq.deleted",
    targetType: "Faq",
    targetId: id,
    description: `سوال متداول حذف شد: «${faq.question}»`,
  });

  return apiSuccess({ id }, { message: "سوال متداول حذف شد" });
}
