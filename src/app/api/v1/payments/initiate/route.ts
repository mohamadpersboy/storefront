import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { initiatePaymentSchema } from "@/lib/validations/payments";
import { computeRemainingOnlineAmount } from "@/lib/utils/pricing";
import { requestZarinpalPayment, getZarinpalStartPayUrl } from "@/lib/payment/zarinpal";
import { env } from "@/config/env";

export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = initiatePaymentSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const order = await Order.findById(parsed.data.orderId).populate(
    "customer",
    "phoneNumber",
  );
  if (!order) {
    return apiError("سفارش یافت نشد", { status: 404 });
  }
  if (order.paymentMethod === "cash") {
    return apiError("این سفارش پرداخت در محل است و بخش آنلاین ندارد", { status: 422 });
  }

  const paidSoFar = await Payment.aggregate<{ _id: null; total: number }>([
    { $match: { order: order._id, status: "paid" } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);
  const alreadyPaid = paidSoFar[0]?.total ?? 0;
  const remaining = computeRemainingOnlineAmount(order.prepaymentAmount, alreadyPaid);

  if (remaining <= 0) {
    return apiError("بخش آنلاین این سفارش قبلاً به‌طور کامل پرداخت شده است", {
      status: 409,
    });
  }

  // Reuse an already-open (not yet resolved) payment session instead of
  // stacking duplicate Zarinpal authorities for the same order.
  const openPayment = await Payment.findOne({
    order: order._id,
    status: { $in: ["pending", "processing"] },
  }).sort({ createdAt: -1 });
  if (openPayment) {
    return apiSuccess({
      paymentId: openPayment.id,
      paymentUrl: getZarinpalStartPayUrl(openPayment.authority),
      amount: openPayment.amount,
      reused: true,
    });
  }

  const customer = order.customer as unknown as { phoneNumber?: string } | undefined;
  const description = `پرداخت سفارش #${order.orderNumber} — فروشگاه فرش`;
  const callbackUrl = new URL("/api/v1/payments/callback", env.NEXT_PUBLIC_APP_URL).toString();

  const result = await requestZarinpalPayment({
    amount: remaining,
    description,
    callbackUrl,
    mobile: customer?.phoneNumber,
  });

  if (!("authority" in result)) {
    return apiError(result.message, { status: 502 });
  }

  const { authority, paymentUrl } = result;

  const payment = await Payment.create({
    order: order._id,
    amount: remaining,
    provider: "zarinpal",
    status: "pending",
    authority,
    description,
    initiatedBy: guard.user!.id,
  });

  return apiSuccess(
    { paymentId: payment.id, paymentUrl, amount: remaining, reused: false },
    { status: 201 },
  );
}
