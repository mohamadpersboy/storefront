import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { checkoutSchema } from "@/lib/validations/checkout";
import { getOrCreateCart, recalculateCart } from "@/lib/cart/cart-service";
import { createOrder, OrderCreationError } from "@/lib/orders/create-order";
import { initiateOrderPayment, PaymentInitiationError } from "@/lib/payment/initiate-order-payment";

/**
 * اولین Checkout واقعی پروژه — Cart کاربر Login‌شده را (بعد از یک
 * بازمحاسبه کامل، دقیقاً مثل `POST /api/v1/cart/validate`) به یک
 * سفارش واقعی تبدیل می‌کند و در همان درخواست، پرداخت را هم شروع
 * می‌کند (شامل پرداخت ترکیبی با Wallet در صورت درخواست).
 *
 * برخلاف `POST /api/v1/orders` (که فقط Staff با `ORDERS_UPDATE"
 * می‌تواند صدا بزند)، این Route با `requireAuthenticatedUser` باز
 * است — چون خود مشتری صاحب سفارش است، نه یک ادمین که از طرف او کار
 * می‌کند.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const cart = await getOrCreateCart(guard.user.id);
  const { discount } = await recalculateCart(cart);
  await cart.save();

  if (cart.items.length === 0) {
    return apiError("سبد خرید شما خالی است", { status: 422 });
  }
  const unavailableItem = cart.items.find((item) => !item.isAvailable);
  if (unavailableItem) {
    return apiError(
      "برخی از کالاهای سبد خرید دیگر در دسترس نیستند؛ لطفاً سبد خرید را اصلاح کنید",
      { status: 422 },
    );
  }

  const items = cart.items.map((item) => ({
    productId: String(item.product),
    variantId: String(item.variantId),
    quantity: item.quantity,
  }));

  let orderResult;
  try {
    orderResult = await createOrder({
      customerId: guard.user.id,
      items,
      shippingAddress: parsed.data.shippingAddress,
      shippingCost: parsed.data.shippingCost,
      paymentMethod: parsed.data.paymentMethod,
      prepaymentPercent: parsed.data.prepaymentPercent,
      couponCode: discount?.code,
      notes: parsed.data.notes,
      actorId: guard.user.id,
    });
  } catch (error) {
    if (error instanceof OrderCreationError) {
      return apiError(error.message, { status: error.status });
    }
    throw error;
  }

  const { order } = orderResult;

  // سفارش با موفقیت ثبت شد — سبد خرید دیگر لازم نیست (کد تخفیف
  // اعمال‌شده هم پاک می‌شود، چون مصرفش همین الان روی همین سفارش ثبت شد).
  cart.items = [];
  cart.cartTotal = 0;
  cart.appliedCoupon = null;
  await cart.save();

  if (order.paymentMethod === "cash") {
    return apiSuccess(
      {
        order: { id: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount },
        payment: null,
      },
      { status: 201, message: "سفارش با موفقیت ثبت شد" },
    );
  }

  try {
    const payment = await initiateOrderPayment({
      orderId: order.id,
      initiatedByUserId: guard.user.id,
      useWallet: parsed.data.useWallet,
    });

    return apiSuccess(
      {
        order: { id: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount },
        payment,
      },
      { status: 201, message: "سفارش ثبت شد" },
    );
  } catch (error) {
    // سفارش با موفقیت ثبت شده، فقط شروع پرداخت ناموفق بوده — سفارش
    // را از دست نمی‌دهیم؛ مشتری می‌تواند بعداً از صفحه سفارش دوباره
    // برای پرداخت اقدام کند (همان `POST /api/v1/payments/initiate`).
    if (error instanceof PaymentInitiationError) {
      return apiSuccess(
        {
          order: { id: order.id, orderNumber: order.orderNumber, totalAmount: order.totalAmount },
          payment: null,
          paymentError: error.message,
        },
        { status: 201, message: "سفارش ثبت شد اما شروع پرداخت با خطا مواجه شد" },
      );
    }
    throw error;
  }
}
