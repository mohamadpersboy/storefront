import { connectToDatabase } from "@/lib/db/connect";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { PaymentInitiationError } from "@/lib/payment/initiate-order-payment";
import { isPaymentLinkToken, PaymentLinkError, startPaymentFromLink } from "@/lib/payment/payment-links";

/**
 * Public — شروع پرداخت از صفحه‌ی `/pay/<token>`. توکن تنها مرجع اعتماد است؛
 * Body نادیده گرفته می‌شود (مبلغ/سفارش فقط از DB).
 */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!isPaymentLinkToken(token)) return apiError("لینک پرداخت معتبر نیست", { status: 404 });

  await connectToDatabase();

  try {
    const { paymentUrl } = await startPaymentFromLink(token);
    return apiSuccess({ paymentUrl });
  } catch (error) {
    if (error instanceof PaymentLinkError || error instanceof PaymentInitiationError) {
      return apiError(error.message, { status: error.status });
    }
    console.error("[pay/start] failed:", (error as Error)?.name);
    return apiError("شروع پرداخت ممکن نشد؛ چند لحظه بعد دوباره تلاش کنید", { status: 500 });
  }
}
