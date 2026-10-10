import mongoose, { type ClientSession } from "mongoose";

/**
 * خطای «این Deployment از Transaction پشتیبانی نمی‌کند» (Mongo Standalone).
 * روی Atlas / Replica Set این خطا هرگز رخ نمی‌دهد.
 */
function isTransactionUnsupported(error: unknown): boolean {
  const e = error as { code?: number; message?: string } | null;
  if (!e) return false;
  if (e.code === 20) return true; // IllegalOperation
  return /Transaction numbers are only allowed|replica set member or mongos/i.test(e.message ?? "");
}

/**
 * عملیات را در یک Transaction اجرا می‌کند (همه یا هیچ). اگر Deployment
 * از Transaction پشتیبانی نکند، همان تابع بدون Session (`null`) اجرا
 * می‌شود؛ در آن حالت فقط ترتیب عملیات و کلیدهای Idempotency از تکرار
 * اثر مالی جلوگیری می‌کنند. خطای پشتیبانی همیشه قبل از هر نوشتن رخ
 * می‌دهد، پس اجرای دوباره بدون Session اثر دوگانه نمی‌سازد.
 */
export async function runInTransaction<T>(
  fn: (session: ClientSession | null) => Promise<T>,
): Promise<T> {
  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    let result!: T;
    await session.withTransaction(async () => {
      result = await fn(session);
    });
    return result;
  } catch (error) {
    if (isTransactionUnsupported(error)) return fn(null);
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}
