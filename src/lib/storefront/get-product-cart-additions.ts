import { Cart } from "@/models/Cart";
import { recalculateCart } from "@/lib/cart/cart-service";
import type { CartAddition } from "@/lib/storefront/product-purchase-math";

/**
 * ردیف‌های *واقعی* سبد خرید کاربر که به همین محصول تعلق دارند —
 * برای مقداردهی اولیه `ProductCartAdditionsSummary` در صفحه جزئیات
 * محصول (Server Component)، طبق دستور صریح کارفرما: «این بخش نباید
 * با هر Refresh از بین برود»، یعنی باید از سبد واقعی سرور خوانده
 * شود، نه فقط از یک State محلی مرورگر که با هر Reload صفر می‌شود.
 *
 * عمداً `recalculateCart` را صدا نمی‌زند و چیزی روی سبد `Save`
 * نمی‌کند — این فقط یک Read سبک برای نمایش اولیه صفحه محصول است؛
 * آخرین مقادیر محاسبه‌شده (از آخرین Add/Update/Delete واقعی روی
 * همان Cart) برای این نمایش کافی است. مرجع نهایی و همیشه
 * تازه‌محاسبه‌شده قیمت/موجودی همچنان خودِ صفحه `/cart`
 * (`GET /api/v1/cart`) است.
 *
 * کاربر Guest (بدون Session) همیشه فهرست خالی می‌گیرد — بدون هیچ
 * Query‌ای؛ Cart در این پروژه فقط برای کاربران Login‌شده طراحی شده
 * (نگاه کنید Decisions Log، Phase 7).
 */
export async function getCartAdditionsForProduct(
  userId: string | null,
  productId: string,
): Promise<CartAddition[]> {
  if (!userId) return [];

  const cart = await Cart.findOne({ user: userId });
  if (!cart) return [];
  if (!cart.items.some((item) => String(item.product) === productId)) return [];

  // وضعیت موجودی را تازه حساب می‌کند تا ردیفی که بعد از افزودن ناموجود
  // شده «ناموجود شده است» نشان داده شود. عمداً `save` نمی‌شود.
  await recalculateCart(cart);

  return cart.items
    .filter((item) => String(item.product) === productId)
    .map((item) => ({
      variantId: String(item.variantId),
      itemId: String(item._id),
      unitLabel: item.unit,
      quantity: item.quantity,
      unitPrice: item.finalUnitPrice,
      isAvailable: item.isAvailable !== false,
    }));
}
