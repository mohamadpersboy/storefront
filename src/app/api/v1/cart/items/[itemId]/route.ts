import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { updateCartItemSchema } from "@/lib/validations/cart";
import { getOrCreateCart, recalculateCart, serializeCart } from "@/lib/cart/cart-service";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { itemId } = await params;

  const json = await request.json().catch(() => null);
  const parsed = updateCartItemSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);

  const item = cart.items.find((i) => String(i._id) === itemId);
  if (!item) {
    return apiError("این قلم در سبد خرید یافت نشد", { status: 404 });
  }

  item.quantity = parsed.data.quantity;

  // recalculateCart خودش موجودی را دوباره چک می‌کند و اگر تعداد
  // جدید از موجودی بیشتر باشد، isAvailable=false + پیام مناسب
  // برمی‌گرداند (نه یک خطای HTTP سخت) — چون این خیلی رایج‌تر از حالت
  // Add است و کاربر باید بتواند همچنان Item را ببیند/کم کند.
  const productMap = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ itemId: string }> },
) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const { itemId } = await params;

  await connectToDatabase();
  const cart = await getOrCreateCart(guard.user.id);

  const initialLength = cart.items.length;
  cart.items = cart.items.filter((i) => String(i._id) !== itemId) as typeof cart.items;

  if (cart.items.length === initialLength) {
    return apiError("این قلم در سبد خرید یافت نشد", { status: 404 });
  }

  const productMap = await recalculateCart(cart);
  await cart.save();

  return apiSuccess(serializeCart(cart, productMap), { message: "از سبد خرید حذف شد" });
}
