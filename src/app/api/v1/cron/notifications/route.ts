import { timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { getNotificationConfig } from "@/lib/notifications/runtime-config";
import { runScheduledNotifications } from "@/lib/notifications/scheduled";

function isAuthorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Vercel Cron → این Route → `runScheduledNotifications` (Service).
 * این‌جا فقط احراز هویت و Orchestration است؛ منطق Business در Service.
 * بدون `CRON_SECRET` هرگز اجرا نمی‌شود.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return apiError("Cron غیرفعال است", { status: 503 });
  }
  if (!isAuthorized(request.headers.get("authorization"), env.CRON_SECRET)) {
    return apiError("دسترسی غیرمجاز", { status: 401 });
  }

  await connectToDatabase();
  const result = await runScheduledNotifications(new Date(), getNotificationConfig());
  return apiSuccess(result);
}
