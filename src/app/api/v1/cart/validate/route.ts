import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { getOrCreateCart, recalculateCart, serializeCart } from "@/lib/cart/cart-service";

/**
 * بررسی/محاسبه مجدد کامل Cart (بند ۷ سند Audit) — باید قبل از
 * Checkout صدا زده شود تا مطمئن شویم قیمت‌ها/موجودی از آخرین وضعیت
 * DB است، نه هر چیزی که قبلاً در Cart ذخیره شده بود. از نظر منطق با
 * `GET /api/v1/cart` یکسان است (همان `recalculateCart`)؛ به‌عنوان یک
 * Endpoint POST جدا وجود دارد چون معنایی متفاوت دارد (تلاش صریح برای
 * اعتبارسنجی قبل از پرداخت) و در آینده (Phase 8) می‌تواند بررسی‌های
 * اضافه‌تری مثل تطبیق کد تخفیف بگیرد بدون تغییر Contract این API.
 */
export async function POST() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);
  const productMap = await recalculateCart(cart);
  await cart.save();

  const isValid = cart.items.length > 0 && cart.items.every((item) => item.isAvailable);

  return apiSuccess({ isValid, cart: serializeCart(cart, productMap) });
}
