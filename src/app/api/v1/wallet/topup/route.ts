import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { topupWalletSchema } from "@/lib/validations/wallet";
import { WalletTopup } from "@/models/WalletTopup";
import { getActiveGateway, getGateway, isOnlineGatewayId } from "@/lib/payment/gateways";
import { GATEWAY_TOKEN_REUSE_TTL_MS } from "@/lib/payment/initiate-order-payment";
import { env } from "@/config/env";

/**
 * شروع شارژ کیف پول (بند «امکان واریز»). کاربر مبلغ را وارد می‌کند،
 * به درگاه زرین‌پال هدایت می‌شود، و بعد از بازگشت
 * (`/api/v1/wallet/topup/callback`) موجودی از طریق همان
 * `adjustWalletBalance` مشترک اعتبار می‌گیرد — دقیقاً همان الگوی
 * `POST /api/v1/payments/initiate` برای سفارش‌ها.
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = topupWalletSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("مبلغ معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  // یک تلاش شارژ باز (هنوز نتیجه‌اش مشخص نشده) را دوباره استفاده کن
  // به‌جای Authority تکراری روی زرین‌پال — دقیقاً همان محافظت که در
  // Payment سفارش‌ها هست.
  const openTopup = await WalletTopup.findOne({
    user: guard.user.id,
    status: "pending",
    amount: parsed.data.amount,
  }).sort({ createdAt: -1 });
  if (openTopup) {
    const openGateway = await getGateway(isOnlineGatewayId(openTopup.provider) ? openTopup.provider : "zarinpal");
    const fresh =
      openGateway.id === "zarinpal" ||
      (Boolean(openTopup.gatewayToken) &&
        Date.now() - new Date(openTopup.createdAt).getTime() < GATEWAY_TOKEN_REUSE_TTL_MS);
    if (fresh) {
      return apiSuccess({
        topupId: openTopup.id,
        paymentUrl: openGateway.buildPaymentUrl({
          authority: openTopup.authority,
          gatewayToken: openTopup.gatewayToken,
        }),
        amount: openTopup.amount,
        reused: true,
      });
    }
  }

  const description = `شارژ کیف پول فرش سقطچی — ${parsed.data.amount.toLocaleString("fa-IR")} تومان`;
  const gateway = await getActiveGateway();
  // زرین‌پال: مسیر قدیمی بدون تغییر. سایر درگاه‌ها: `/callback/<gateway>`.
  const callbackPath =
    gateway.id === "zarinpal"
      ? "/api/v1/wallet/topup/callback"
      : `/api/v1/wallet/topup/callback/${gateway.id}`;
  const callbackUrl = new URL(callbackPath, env.NEXT_PUBLIC_APP_URL).toString();

  const result = await gateway.requestPayment({
    amount: parsed.data.amount,
    description,
    callbackUrl,
    mobile: guard.user.phoneNumber,
  });

  if (!result.ok) {
    return apiError(result.message, { status: 502 });
  }

  const topup = await WalletTopup.create({
    user: guard.user.id,
    amount: parsed.data.amount,
    status: "pending",
    provider: gateway.id,
    authority: result.authority,
    ...(result.gatewayToken ? { gatewayToken: result.gatewayToken } : {}),
    description,
  });

  return apiSuccess(
    { topupId: topup.id, paymentUrl: result.paymentUrl, amount: topup.amount, reused: false },
    { status: 201 },
  );
}
