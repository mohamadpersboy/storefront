import { NextResponse, type NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db/connect";
import { processTopupCallback } from "@/lib/wallet/process-topup-callback";
import { env } from "@/config/env";

/**
 * Public — مرورگر مشتری از زرین‌پال به اینجا برمی‌گردد. `Status` عمداً
 * نادیده گرفته می‌شود؛ فقط Verify سرور-به-سرور معتبر است. هیچ جزئیات
 * خطایی در Redirect/Log بیرون نمی‌رود.
 */
export async function GET(request: NextRequest) {
  const authority = request.nextUrl.searchParams.get("Authority");
  const resultUrl = new URL("/wallet/topup/result", env.NEXT_PUBLIC_APP_URL);

  try {
    await connectToDatabase();
    const result = await processTopupCallback({ authority });
    resultUrl.searchParams.set("status", result.outcome);
    if (result.amount !== undefined) {
      resultUrl.searchParams.set("amount", String(result.amount));
    }
  } catch (error) {
    console.error("[wallet/topup/callback] processing failed:", (error as Error)?.name);
    resultUrl.searchParams.set("status", "pending");
  }

  return NextResponse.redirect(resultUrl);
}
