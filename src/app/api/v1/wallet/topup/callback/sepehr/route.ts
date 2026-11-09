import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { processTopupCallback } from "@/lib/wallet/process-topup-callback";
import { readCallbackData } from "@/lib/payment/gateways/callback-data";
import { env } from "@/config/env";

/** Public — بازگشت مشتری از سپهر برای شارژ کیف پول. همان اصول Callback سفارش. */
async function handle(request: NextRequest) {
  const resultUrl = new URL("/wallet/topup/result", env.NEXT_PUBLIC_APP_URL);
  try {
    const callbackData = await readCallbackData(request);
    await connectToDatabase();
    const result = await processTopupCallback({
      authority: callbackData.invoiceid ?? null,
      gateway: "sepehr",
      callbackData,
    });
    resultUrl.searchParams.set("status", result.outcome);
    if (result.amount !== undefined) resultUrl.searchParams.set("amount", String(result.amount));
  } catch (error) {
    console.error("[wallet/topup/callback/sepehr] processing failed:", (error as Error)?.name);
    resultUrl.searchParams.set("status", "pending");
  }
  return NextResponse.redirect(resultUrl, 303);
}

export const POST = handle;
export const GET = handle;
