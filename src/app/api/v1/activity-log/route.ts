import type { NextRequest } from "next/server";
import type { Types } from "mongoose";
import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { ActivityLog, type IActivityLog } from "@/models/ActivityLog";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";

type LeanLog = IActivityLog & { _id: Types.ObjectId };

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export async function GET(request: NextRequest) {
  const guard = await requireApiUser(PERMISSIONS.ACTIVITY_LOG_READ);
  if (guard.response) return guard.response;

  const { searchParams } = request.nextUrl;
  const parsed = listQuerySchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return apiError("پارامترهای جستجو معتبر نیستند", { status: 422 });
  }

  await connectToDatabase();
  const { page, limit } = parsed.data;

  const result = await ActivityLog.paginate(
    {},
    { page, limit, sort: { createdAt: -1 }, lean: true },
  );

  return apiSuccess(
    (result.docs as LeanLog[]).map((log) => ({
      id: String(log._id),
      actorName: log.actorName,
      action: log.action,
      targetType: log.targetType,
      targetId: log.targetId ? String(log.targetId) : null,
      description: log.description,
      createdAt: log.createdAt,
    })),
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
