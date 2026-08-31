import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { getOrCreateCart, recalculateCart, serializeCart } from "@/lib/cart/cart-service";

/**
 * فقط کاربر Login‌شده — بدون نیاز به یک Permission خاص RBAC، چون
 * Cart متعلق به خود کاربر است، نه یک منبع مدیریتی Dashboard (نگاه
 * کنید به توضیح `requireAuthenticatedUser`).
 */
export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);
  const { productMap, discount } = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap, discount));
}

/** حذف کامل سبد خرید (بند ۷ سند Audit). */
export async function DELETE() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);
  cart.items = [];
  cart.cartTotal = 0;
  // با خالی‌شدن سبد، هر کد تخفیفی که روی آن بود دیگر معنا ندارد
  // (حداقل مبلغ سفارش با ۰ تومان قابل رعایت نیست).
  cart.appliedCoupon = null;
  await cart.save();

  return apiSuccess(
    {
      id: String(cart._id),
      items: [],
      cartTotal: 0,
      appliedCoupon: null,
      discountAmount: 0,
      grandTotal: 0,
      itemCount: 0,
    },
    { message: "سبد خرید خالی شد" },
  );
}
