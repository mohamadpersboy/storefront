import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Payment } from "@/models/Payment";
import "@/models/Order"; // registers "Order" for populate() below
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { env } from "@/config/env";

/**
 * Public — Zarinpal redirects the *customer's* browser here after they
 * finish (or abandon) the payment page, and the customer is never
 * logged into the Dashboard. No session/permission check applies; the
 * only trust anchor is the Zarinpal `authority`, which Zarinpal itself
 * re-verifies server-to-server before this route marks anything paid.
 */
export async function GET(request: NextRequest) {
  const authority = request.nextUrl.searchParams.get("Authority");
  const status = request.nextUrl.searchParams.get("Status");
  const resultUrl = new URL("/payment/result", env.NEXT_PUBLIC_APP_URL);

  if (!authority) {
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl);
  }

  await connectToDatabase();
  const payment = await Payment.findOne({ authority }).populate("order", "orderNumber customer");
  if (!payment) {
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl);
  }

  const order = payment.order as unknown as { orderNumber: number; customer: unknown } | null;
  if (order) resultUrl.searchParams.set("orderNumber", String(order.orderNumber));
  resultUrl.searchParams.set("amount", String(payment.amount));

  /**
   * اگر بخشی از این پرداخت از کیف پول کسر شده بود (`walletAmount`،
   * پرداخت ترکیبی) و در نهایت تلاش درگاه شکست خورد/لغو شد، آن بخش
   * باید به کیف پول برگردد — وگرنه مشتری بابت یک تلاش پرداخت ناموفق
   * واقعاً پول از دست می‌دهد. این تابع فقط زمانی صدا زده می‌شود که
   * `payment.status` دارد از pending/processing به failed می‌رود
   * (یعنی دقیقاً یک‌بار، چون Guard بالای همین فایل از پردازش دوباره
   * یک Payment که قبلاً failed شده جلوگیری می‌کند).
   */
  const orderNumber = order?.orderNumber;
  const walletAmount = payment.walletAmount;
  const customerId = order?.customer ? String(order.customer) : null;

  async function refundWalletPortionIfAny(reason: string) {
    if (walletAmount > 0 && customerId) {
      await adjustWalletBalance({
        userId: customerId,
        type: "credit",
        amount: walletAmount,
        reason,
        performedBy: customerId,
      });
    }
  }

  // A duplicate hit on an already-resolved payment (e.g. the customer
  // reloaded the callback page) is answered from the stored result
  // instead of re-verifying with Zarinpal.
  if (payment.status === "paid") {
    resultUrl.searchParams.set("status", "success");
    return NextResponse.redirect(resultUrl);
  }
  if (payment.status !== "pending" && payment.status !== "processing") {
    resultUrl.searchParams.set("status", "failed");
    return NextResponse.redirect(resultUrl);
  }

  if (status !== "OK") {
    payment.status = "failed";
    payment.failureReason = "کاربر پرداخت را تکمیل نکرد یا لغو کرد";
    await payment.save();
    await refundWalletPortionIfAny(
      `استرداد بخش کیف پول — سفارش #${orderNumber} توسط مشتری لغو شد`,
    );
    resultUrl.searchParams.set("status", "failed");
    return NextResponse.redirect(resultUrl);
  }

  const verification = await verifyZarinpalPayment({
    amount: payment.amount,
    authority,
  });

  if (verification.success) {
    payment.status = "paid";
    payment.refId = verification.refId;
    payment.cardPan = verification.cardPan;
    payment.paidAt = new Date();
    await payment.save();

    resultUrl.searchParams.set("status", "success");
  } else {
    payment.status = "failed";
    payment.failureReason = verification.message;
    await payment.save();
    await refundWalletPortionIfAny(
      `استرداد بخش کیف پول — پرداخت سفارش #${orderNumber} توسط درگاه تأیید نشد`,
    );
    resultUrl.searchParams.set("status", "failed");
  }

  return NextResponse.redirect(resultUrl);
}
