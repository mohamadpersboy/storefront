import { connectToDatabase } from "@/lib/db/connect";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { initiatePaymentSchema } from "@/lib/validations/payments";
import { initiateOrderPayment, PaymentInitiationError } from "@/lib/payment/initiate-order-payment";

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

  try {
    const result = await initiateOrderPayment({
      orderId: parsed.data.orderId,
      initiatedByUserId: guard.user.id,
      useWallet: parsed.data.useWallet,
    });
    return apiSuccess(result, { status: 201 });
  } catch (error) {
    if (error instanceof PaymentInitiationError) {
      return apiError(error.message, { status: error.status });
    }
    throw error;
  }
}
