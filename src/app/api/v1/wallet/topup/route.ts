import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { topupWalletSchema } from "@/lib/validations/wallet";
import { WalletTopup } from "@/models/WalletTopup";
import { requestZarinpalPayment, getZarinpalStartPayUrl } from "@/lib/payment/zarinpal";
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
    return apiSuccess({
      topupId: openTopup.id,
      paymentUrl: getZarinpalStartPayUrl(openTopup.authority),
      amount: openTopup.amount,
      reused: true,
    });
  }

  const description = `شارژ کیف پول فرش سقطچی — ${parsed.data.amount.toLocaleString("fa-IR")} تومان`;
  const callbackUrl = new URL(
    "/api/v1/wallet/topup/callback",
    env.NEXT_PUBLIC_APP_URL,
  ).toString();

  const result = await requestZarinpalPayment({
    amount: parsed.data.amount,
    description,
    callbackUrl,
    mobile: guard.user.phoneNumber,
  });

  if (!("authority" in result)) {
    return apiError(result.message, { status: 502 });
  }

  const topup = await WalletTopup.create({
    user: guard.user.id,
    amount: parsed.data.amount,
    status: "pending",
    authority: result.authority,
    description,
  });

  return apiSuccess(
    { topupId: topup.id, paymentUrl: result.paymentUrl, amount: topup.amount, reused: false },
    { status: 201 },
  );
}
