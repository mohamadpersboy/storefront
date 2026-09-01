import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { WalletTopup } from "@/models/WalletTopup";
import { verifyZarinpalPayment } from "@/lib/payment/zarinpal";
import { adjustWalletBalance } from "@/lib/wallet/wallet-service";
import { env } from "@/config/env";

/**
 * عمومی — زرین‌پال مرورگر *خود کاربر* را به این‌جا هدایت می‌کند؛
 * دقیقاً همان الگوی امنیتی `payments/callback` (بدون Session Check،
 * تنها لنگر اعتماد خود Authority زرین‌پال است که سرور-به-سرور دوباره
 * از زرین‌پال Verify می‌شود).
 */
export async function GET(request: NextRequest) {
  const authority = request.nextUrl.searchParams.get("Authority");
  const status = request.nextUrl.searchParams.get("Status");
  const resultUrl = new URL("/wallet/topup/result", env.NEXT_PUBLIC_APP_URL);

  if (!authority) {
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl);
  }

  await connectToDatabase();
  const topup = await WalletTopup.findOne({ authority });
  if (!topup) {
    resultUrl.searchParams.set("status", "error");
    return NextResponse.redirect(resultUrl);
  }

  resultUrl.searchParams.set("amount", String(topup.amount));

  // درخواست تکراری روی یک تراکنش که قبلاً نتیجه‌اش مشخص شده —
  // دوباره با زرین‌پال Verify نمی‌کنیم.
  if (topup.status === "paid") {
    resultUrl.searchParams.set("status", "success");
    return NextResponse.redirect(resultUrl);
  }
  if (topup.status !== "pending") {
    resultUrl.searchParams.set("status", "failed");
    return NextResponse.redirect(resultUrl);
  }

  if (status !== "OK") {
    topup.status = "failed";
    topup.failureReason = "کاربر پرداخت را تکمیل نکرد یا لغو کرد";
    await topup.save();
    resultUrl.searchParams.set("status", "failed");
    return NextResponse.redirect(resultUrl);
  }

  const verification = await verifyZarinpalPayment({ amount: topup.amount, authority });

  if (verification.success) {
    topup.status = "paid";
    topup.refId = verification.refId;
    topup.cardPan = verification.cardPan;
    topup.paidAt = new Date();
    await topup.save();

    // اعتبار موجودی از همان تابع Atomic مشترک — دقیقاً به همان
    // دلیلی که تعدیل دستی ادمین هم از آن استفاده می‌کند
    // (`adjustWalletBalance`، جلوگیری از Race Condition).
    await adjustWalletBalance({
      userId: String(topup.user),
      type: "credit",
      amount: topup.amount,
      reason: `شارژ کیف پول از طریق درگاه پرداخت (کد پیگیری: ${verification.refId})`,
      performedBy: String(topup.user), // شارژ خودکار/خودِ کاربر، نه ادمین
    });

    resultUrl.searchParams.set("status", "success");
  } else {
    topup.status = "failed";
    topup.failureReason = verification.message;
    await topup.save();
    resultUrl.searchParams.set("status", "failed");
  }

  return NextResponse.redirect(resultUrl);
}
