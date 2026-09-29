import type { NextRequest } from "next/server";
import { requireApiUser } from "@/lib/auth/api-guard";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { connectToDatabase } from "@/lib/db/connect";
import { logActivity } from "@/lib/audit/log-activity";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { Notification } from "@/models/Notification";
import { createNotification } from "@/lib/notifications/service";
import { htmlHasContent, sanitizeNotificationHtml } from "@/lib/notifications/sanitize";
import { toAdminNotificationDTO, type LeanNotification } from "@/lib/notifications/serialize";
import {
  adminNotificationsListQuerySchema,
  createNotificationSchema,
} from "@/lib/validations/notifications";

/** GET /api/v1/notifications/manage — لیست اعلان‌های عمومی برای ادمین. */
export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.NOTIFICATIONS_READ);
  if (guard.response) return guard.response;

  const parsed = adminNotificationsListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams),
  );
  if (!parsed.success) {
    return apiError("پارامترهای درخواست نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }
  const { page, limit, search, status, type } = parsed.data;

  await connectToDatabase();

  // اعلان شخصی (سفارش، کد اختصاصی، ...) هرگز در مدیریت ادمین نیست.
  const filter: Record<string, unknown> = { audience: "public" };
  if (status) filter.status = status;
  if (type) filter.type = type;
  if (search) filter.title = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

  const result = await Notification.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1, _id: -1 },
    lean: true,
  });

  const now = new Date();
  return apiSuccess(
    (result.docs as unknown as LeanNotification[]).map((doc) => toAdminNotificationDTO(doc, now)),
    {
      pagination: {
        totalDocs: result.totalDocs,
        totalPages: result.totalPages,
        page: result.page ?? page,
        limit: result.limit,
        hasNextPage: result.hasNextPage,
        hasPrevPage: result.hasPrevPage,
      },
    },
  );
}

/** POST /api/v1/notifications/manage — ساخت اعلان عمومی (محتوای Rich Text). */
export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.NOTIFICATIONS_MANAGE);
  if (guard.response) return guard.response;
  const { user: actor } = guard;

  const json = await request.json().catch(() => null);
  const parsed = createNotificationSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات وارد شده نامعتبر است", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }
  const data = parsed.data;

  const content = sanitizeNotificationHtml(data.content);
  if (!htmlHasContent(content) && !data.imageUrl) {
    return apiError("متن یا تصویر اعلان نمی‌تواند خالی باشد", {
      status: 422,
      errors: { content: ["متن یا تصویر اعلان نمی‌تواند خالی باشد"] },
    });
  }

  await connectToDatabase();

  // دستی توسط ادمین ساخته می‌شود، پس خطا نباید بلعیده شود (Best-effort نیست).
  const { id } = await createNotification({
    audience: "public",
    type: data.type,
    title: data.title,
    content,
    contentFormat: "html",
    imageUrl: data.imageUrl ?? null,
    link: data.link ?? null,
    status: data.status,
    publishAt: data.publishAt ?? new Date(),
    expiresAt: data.expiresAt ?? null,
    createdBy: actor._id,
  });

  await logActivity({
    actor,
    action: "notification.created",
    targetType: "Notification",
    targetId: id,
    description: `اعلان «${data.title}» ساخته شد`,
  });

  return apiSuccess({ id }, { message: "اعلان ساخته شد", status: 201 });
}
