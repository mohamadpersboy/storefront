import { timingSafeEqual } from "node:crypto";
import { env } from "@/config/env";
import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { reconcileTopups } from "@/lib/wallet/reconcile-topups";

export const maxDuration = 60;

function isAuthorized(header: string | null, secret: string): boolean {
  const expected = Buffer.from(`Bearer ${secret}`);
  const actual = Buffer.from(header ?? "");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/**
 * Vercel Cron → آشتی‌سازی TopUpهای نیمه‌کاره. فقط احراز هویت و Orchestration؛
 * منطق در `reconcileTopups`. بدون `CRON_SECRET` هرگز اجرا نمی‌شود.
 */
export async function GET(request: Request) {
  if (!env.CRON_SECRET) {
    return apiError("Cron غیرفعال است", { status: 503 });
  }
  if (!isAuthorized(request.headers.get("authorization"), env.CRON_SECRET)) {
    return apiError("دسترسی غیرمجاز", { status: 401 });
  }

  await connectToDatabase();
  const summary = await reconcileTopups();
  return apiSuccess(summary);
}
