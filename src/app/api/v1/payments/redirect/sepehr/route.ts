import { NextResponse, type NextRequest } from "next/server";
import { getSepehrPayUrl, getSepehrTerminalId } from "@/lib/payment/gateways/sepehr-gateway";

/**
 * Public — سپهر فقط درخواست **POST** (فرم) می‌پذیرد، ولی مرورگر کاربر با لینک
 * (GET) می‌آید. این Route یک صفحه‌ی کوچک با فرم POST خودکار به صفحه‌ی پرداخت
 * بانک برمی‌گرداند. Token فقط یک شناسه‌ی کوتاه‌عمرِ همان تراکنش است و هیچ
 * اطلاعات شخصی/مالی ندارد؛ مبلغ و شماره‌ی کارت روی خود بانک نمایش داده می‌شود.
 */
const TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]{8,2048}$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") ?? "";
  if (!TOKEN_PATTERN.test(token)) {
    return new NextResponse("درخواست نامعتبر است", { status: 400 });
  }

  let action: string;
  let terminalId: string;
  try {
    action = getSepehrPayUrl();
    terminalId = getSepehrTerminalId();
  } catch {
    return new NextResponse("درگاه پرداخت پیکربندی نشده است", { status: 503 });
  }

  const html = `<!doctype html>
<html lang="fa" dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
<title>انتقال به درگاه پرداخت</title>
<style>body{font-family:system-ui,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;background:#f3f4f6;color:#111827}p{font-size:15px}</style>
</head>
<body>
<form id="ipg" action="${escapeHtml(action)}" method="POST">
<input type="hidden" name="TerminalID" value="${escapeHtml(terminalId)}">
<input type="hidden" name="token" value="${escapeHtml(token)}">
<noscript><button type="submit">ادامه پرداخت</button></noscript>
</form>
<p>در حال انتقال به درگاه پرداخت امن…</p>
<script>document.getElementById("ipg").submit();</script>
</body>
</html>`;

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Robots-Tag": "noindex",
    },
  });
}
