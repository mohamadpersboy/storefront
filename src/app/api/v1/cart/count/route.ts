import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { Cart } from "@/models/Cart";

/**
 * تعداد ردیف‌های سبد خرید کاربر (برای نشان سبد در `MobileBottomBar`).
 * عمداً سبک: فقط یک خواندن، بدون `recalculateCart`، بدون `save` و
 * بدون ساخت سبد (کاربری که هنوز سبد ندارد ← ۰). Guest ← ۴۰۱ (همان
 * Guard بقیهٔ Cart APIها).
 */
export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const cart = await Cart.findOne({ user: guard.user.id }).select("items").lean();

  return apiSuccess({ count: cart?.items?.length ?? 0 });
}
