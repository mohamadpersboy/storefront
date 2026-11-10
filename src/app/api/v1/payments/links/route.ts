import { connectToDatabase } from "@/lib/db/connect";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { initiatePaymentSchema } from "@/lib/validations/payments";
import { createPaymentLink, PaymentLinkError } from "@/lib/payment/payment-links";
import { env } from "@/config/env";

/**
 * Dashboard — ساخت لینک پرداخت `/pay/<token>` برای یک سفارش. پرداخت
 * این‌جا شروع نمی‌شود؛ فقط وقتی پرداخت‌کننده روی صفحه‌ی ما «پرداخت» بزند.
 */
export async function POST(request: Request) {
  const guard = await requireApiUser(PERMISSIONS.PAYMENTS_MANAGE);
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = initiatePaymentSchema.pick({ orderId: true }).safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", { status: 422, errors: parsed.error.flatten().fieldErrors });
  }

  await connectToDatabase();

  try {
    const link = await createPaymentLink({ orderId: parsed.data.orderId, createdBy: guard.user.id });
    return apiSuccess(
      {
        url: new URL(`/pay/${link.token}`, env.NEXT_PUBLIC_APP_URL).toString(),
        expiresAt: link.expiresAt.toISOString(),
        remaining: link.remaining,
        reused: link.reused,
      },
      { status: link.reused ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof PaymentLinkError) return apiError(error.message, { status: error.status });
    throw error;
  }
}
