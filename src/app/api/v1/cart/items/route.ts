import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { addCartItemSchema } from "@/lib/validations/cart";
import { getOrCreateCart, recalculateCart, serializeCart } from "@/lib/cart/cart-service";
import { Product } from "@/models/Product";
import type { ICartItem } from "@/models/Cart";

export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = addCartItemSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { productId, variantId, quantity } = parsed.data;
  await connectToDatabase();

  // بند ۱-۷ سند Audit: قبل از افزودن، وجود/فعال‌بودن Product و
  // Variant و کافی‌بودن موجودی باید همین‌جا (نه فقط در Recalculate
  // بعدی) بررسی شود تا خطای واضح به کاربر برگردد، نه فقط یک Item
  // «نامعتبر» بی‌صدا در Cart.
  const product = await Product.findOne({
    _id: productId,
    status: "published",
    deletedAt: null,
  }).lean();

  if (!product) {
    return apiError("این محصول در دسترس نیست", { status: 404 });
  }

  const variant = product.variants.find((v) => String(v._id) === variantId);
  if (!variant || !variant.isActive) {
    return apiError("این حالت از محصول در دسترس نیست", { status: 404 });
  }

  const cart = await getOrCreateCart(guard.user.id);

  const existingItem = cart.items.find(
    (item) => String(item.product) === productId && String(item.variantId) === variantId,
  );
  const requestedQuantity = (existingItem?.quantity ?? 0) + quantity;

  if (requestedQuantity > variant.stock) {
    return apiError(
      variant.stock === 0
        ? "این کالا موجود نیست"
        : `موجودی کافی نیست (حداکثر ${variant.stock} عدد موجود است)`,
      { status: 409 },
    );
  }

  if (existingItem) {
    existingItem.quantity = requestedQuantity;
  } else {
    // فیلدهای قیمت/در دسترس‌بودن فوراً بعد از این با
    // `recalculateCart` بازنویسی می‌شوند؛ مقادیر این‌جا فقط برای
    // رعایت تایپ ICartItem کامل هستند (Mongoose خودش `_id` را
    // خودکار می‌سازد).
    cart.items.push({
      product: product._id,
      variantId: variant._id,
      quantity,
      unit: variant.unit,
      unitPrice: variant.price,
      discountPercent: variant.discountPercent,
      discountAmount: variant.discountAmount,
      finalUnitPrice: 0,
      itemTotal: 0,
      isAvailable: true,
      unavailableReason: null,
    } as unknown as ICartItem);
  }

  const productMap = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap), { message: "به سبد خرید اضافه شد" });
}
