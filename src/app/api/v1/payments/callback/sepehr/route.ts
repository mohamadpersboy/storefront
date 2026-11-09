import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { processGatewayCallback } from "@/lib/payment/process-gateway-callback";
import { readCallbackData } from "@/lib/payment/gateways/callback-data";
import { env } from "@/config/env";

/**
 * Public — سپهر مرورگر مشتری را با POST (یا GET) به اینجا برمی‌گرداند. هیچ
 * Session وجود ندارد؛ تنها مرجع اعتماد، Advice سرور-به-سرور است. `respcode`
 * و `amount` فقط ورودی‌اند و در Adapter با Advice تطبیق داده می‌شوند.
 * Redirect با ۳۰۳ تا POST به GET تبدیل شود.
 */
async function handle(request: NextRequest) {
  const resultUrl = new URL("/payment/result", env.NEXT_PUBLIC_APP_URL);
  try {
    const callbackData = await readCallbackData(request);
    await connectToDatabase();
    const result = await processGatewayCallback({
      authority: callbackData.invoiceid ?? null,
      gateway: "sepehr",
      callbackData,
    });
    resultUrl.searchParams.set("status", result.outcome);
    if (result.orderNumber !== undefined) resultUrl.searchParams.set("orderNumber", String(result.orderNumber));
    if (result.amount !== undefined) resultUrl.searchParams.set("amount", String(result.amount));
  } catch (error) {
    console.error("[payments/callback/sepehr] processing failed:", (error as Error)?.name);
    resultUrl.searchParams.set("status", "pending");
  }
  return NextResponse.redirect(resultUrl, 303);
}

export const POST = handle;
export const GET = handle;
