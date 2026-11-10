import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { processGatewayCallback } from "@/lib/payment/process-gateway-callback";
import { getPaymentLinkReturnPath } from "@/lib/payment/payment-links";
import { env } from "@/config/env";

/**
 * Public — Zarinpal redirects the *customer's* browser here. هیچ Session
 * وجود ندارد؛ تنها مرجع اعتماد، Verify سرور-به-سرور با درگاه روی مبلغ
 * ذخیره‌شده است. پارامتر `Status` عمداً نادیده گرفته می‌شود (قابل
 * دستکاری توسط کاربر)؛ تمام منطق در `processGatewayCallback` است.
 * هیچ جزئیات خطا/اعتبارنامه‌ای در Redirect یا Log بیرون نمی‌رود.
 */
export async function GET(request: NextRequest) {
  const authority = request.nextUrl.searchParams.get("Authority");
  let resultUrl = new URL("/payment/result", env.NEXT_PUBLIC_APP_URL);

  try {
    await connectToDatabase();
    const result = await processGatewayCallback({ authority });
    // پرداخت از صفحه‌ی `/pay/<token>` شروع شده؟ به همان صفحه برگرد.
    const back = await getPaymentLinkReturnPath(authority);
    if (back) resultUrl = new URL(back, env.NEXT_PUBLIC_APP_URL);
    resultUrl.searchParams.set("status", result.outcome);
    if (result.orderNumber !== undefined) {
      resultUrl.searchParams.set("orderNumber", String(result.orderNumber));
    }
    if (result.amount !== undefined) {
      resultUrl.searchParams.set("amount", String(result.amount));
    }
  } catch (error) {
    // فقط نوع خطا Log می‌شود؛ نه Authority نه پیام کامل.
    console.error("[payments/callback] processing failed:", (error as Error)?.name);
    resultUrl.searchParams.set("status", "pending");
  }

  return NextResponse.redirect(resultUrl);
}
