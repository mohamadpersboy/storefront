import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { Payment } from "@/models/Payment";
import "@/models/Order"; // registers "Order" for populate() below
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
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
  const payment = await Payment.findOne({ authority }).populate("order", "orderNumber");
  if (!payment) {
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl);
  }

  const order = payment.order as unknown as { orderNumber: number } | null;
  if (order) resultUrl.searchParams.set("orderNumber", String(order.orderNumber));
  resultUrl.searchParams.set("amount", String(payment.amount));

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
    resultUrl.searchParams.set("status", "failed");
  }

  return NextResponse.redirect(resultUrl);
}
