import mongoose from "mongoose";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { logActivity } from "@/lib/audit/log-activity";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { Notification } from "@/models/Notification";
import { NotificationRead } from "@/models/NotificationRead";
import { buildAdminUpdate, canHardDelete } from "@/lib/notifications/admin";
import { toAdminNotificationDetailDTO, type LeanNotification } from "@/lib/notifications/serialize";
import { updateNotificationSchema } from "@/lib/validations/notifications";

type Ctx = { params: Promise<{ id: string }> };

async function findPublic(id: string) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Notification.findOne({ _id: id, audience: "public" });
}

export async function GET(_request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.NOTIFICATIONS_READ);
  if (guard.response) return guard.response;

  const { id } = await params;
  await connectToDatabase();
  const doc = mongoose.isValidObjectId(id)
    ? ((await Notification.findOne({ _id: id, audience: "public" }).lean()) as unknown as LeanNotification | null)
    : null;
  if (!doc) return apiError("اعلان پیدا نشد", { status: 404 });

  return apiSuccess(toAdminNotificationDetailDTO(doc, new Date()));
}

/** PATCH — ویرایش، انتشار (`status: published`)، غیرفعال/آرشیو (`status: archived`). */
export async function PATCH(request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.NOTIFICATIONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  const json = await request.json().catch(() => null);
  const parsed = updateNotificationSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات وارد شده نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const doc = await findPublic(id);
  if (!doc) return apiError("اعلان پیدا نشد", { status: 404 });

  const result = buildAdminUpdate(doc, parsed.data, new Date());
  if (!result.ok) {
    return apiError(result.message, {
      status: 422,
      errors: { [result.field]: [result.message] },
    });
  }

  doc.set(result.update);
  await doc.save();

  await logActivity({
    actor,
    action: "notification.updated",
    targetType: "Notification",
    targetId: doc.id,
    description: `اعلان «${doc.title}» ویرایش شد (${doc.status})`,
  });

  return apiSuccess({ id: doc.id, status: doc.status }, { message: "اعلان ذخیره شد" });
}

/** DELETE — فقط Draft؛ اعلان منتشرشده فقط Archive می‌شود (Auditability). */
export async function DELETE(_request: Request, { params }: Ctx) {
  const guard = await requireApiUser(PERMISSIONS.NOTIFICATIONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const { id } = await params;
  await connectToDatabase();
  const doc = await findPublic(id);
  if (!doc) return apiError("اعلان پیدا نشد", { status: 404 });

  if (!canHardDelete(doc.status)) {
    return apiError("اعلان منتشرشده قابل حذف نیست؛ آن را آرشیو کنید", { status: 409 });
  }

  const title = doc.title;
  await NotificationRead.deleteMany({ notification: doc._id });
  await doc.deleteOne();

  await logActivity({
    actor,
    action: "notification.deleted",
    targetType: "Notification",
    targetId: id,
    description: `پیش‌نویس اعلان «${title}» حذف شد`,
  });

  return apiSuccess({ id }, { message: "پیش‌نویس حذف شد" });
}
