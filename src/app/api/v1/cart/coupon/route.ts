import { z } from "zod";
import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import {
  applyCouponToCart,
  getOrCreateCart,
  recalculateCart,
  serializeCart,
} from "@/lib/cart/cart-service";

const applyCouponSchema = z.object({
  code: z.string().trim().min(1, "کد تخفیف الزامی است").max(50),
});

/**
 * اعمال کد تخفیف روی Cart (بند ۸ سند Audit — هماهنگی Cart با
 * Discount). عمداً هیچ‌چیز روی `Coupon.usedCount`/`CouponRedemption`
 * این‌جا ثبت نمی‌شود — «استفاده واقعی» از کد تخفیف فقط در لحظه ثبت
 * سفارش واقعی (`POST /api/v1/orders`، Phase 8 خارج از این فایل) اتفاق
 * می‌افتد؛ در غیر این صورت یک سبد خریدی که هرگز به سفارش تبدیل نمی‌شود
 * ظرفیت کد تخفیف را هدر می‌داد.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = applyCouponSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("کد تخفیف معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);

  // ابتدا Item ها را با آخرین وضعیت DB به‌روز می‌کنیم تا اعتبارسنجی
  // حداقل مبلغ سفارش روی یک `cartTotal` تازه انجام شود، نه یک عدد
  // قدیمی احتمالاً نادرست.
  await recalculateCart(cart);

  const result = await applyCouponToCart(cart, parsed.data.code);
  if (!result.success) {
    return apiError(result.reason ?? "این کد تخفیف قابل استفاده نیست", { status: 422 });
  }

  const { productMap, discount } = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap, discount), {
    message: "کد تخفیف اعمال شد",
  });
}

export async function DELETE() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);
  cart.appliedCoupon = null;

  const { productMap, discount } = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap, discount), {
    message: "کد تخفیف حذف شد",
  });
}
