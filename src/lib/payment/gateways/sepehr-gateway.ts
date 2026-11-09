import { randomUUID } from "node:crypto";
import { env } from "@/config/env";
import type { PaymentGateway } from "@/lib/payment/gateways/types";

/**
 * Adapter درگاه پرداخت الکترونیک سپهر (توکن) — مستند نسخه 4.0.2.
 *
 * جریان: GetToken → Redirect مشتری به `/Payment/Pay` → Callback (POST) به
 * سایت → Advice (تأیید) از سرور. بدون Advice، سپهر پس از ۳۰ دقیقه
 * تراکنش را خودکار برمی‌گرداند.
 *
 * - مبلغ در Sepehr «ریال» است؛ پروژه تومان نگه می‌دارد (× ۱۰).
 * - Callback شامل Token نیست؛ کلید جستجو `invoiceid` است که ما می‌سازیم
 *   (UUID تصادفی؛ حدس‌زدنی نیست) و در `Payment.authority` ذخیره می‌شود.
 * - `respcode` و `amount` در Callback از مرورگر مشتری می‌آیند و قابل
 *   جعل‌اند. تنها مرجع پول، پاسخ Advice (`ReturnId` = مبلغ) است.
 */

export const SEPEHR_VERIFY_TIMEOUT_MS = 8000;
const TOKEN_TIMEOUT_MS = 10000;
const RIAL_PER_TOMAN = 10;
const RECEIPT_PATTERN = /^[A-Za-z0-9-]{10,64}$/;

/** شناسه فاکتور یکتا و غیرقابل‌حدس (فقط حروف/عدد؛ حداکثر ۳۲ نویسه). */
export function createSepehrInvoiceId(): string {
  return randomUUID().replace(/-/g, "");
}

export function sepehrAmountToRial(toman: number): number {
  return toman * RIAL_PER_TOMAN;
}

function baseUrl(): string {
  return (env.SEPEHR_BASE_URL ?? "https://sepehr.shaparak.ir").replace(/\/+$/, "");
}

function terminalId(): string {
  const id = env.SEPEHR_TERMINAL_ID;
  if (!id) throw new Error("SEPEHR_TERMINAL_ID is not configured");
  return id;
}

/** payload نباید نویسه‌های خاص داشته باشد؛ ما چیزی در آن نمی‌فرستیم. */
const PAYLOAD = "";

const TOKEN_ERRORS: Record<number, string> = {
  [-2]: "درگاه سپهر درخواست را نپذیرفت (آدرس IP سرور مجاز نیست)",
  [-3]: "خطای عمومی درگاه سپهر",
  [-4]: "آدرس بازگشت با دامنه سایت مطابقت ندارد",
  [-5]: "آدرس IP سرور در درگاه سپهر ثبت نشده است",
};

export const sepehrGateway: PaymentGateway = {
  id: "sepehr",

  async requestPayment({ amount, callbackUrl, mobile }) {
    const invoiceId = createSepehrInvoiceId();
    try {
      const response = await fetch(`${baseUrl()}/Rest/V1/PeymentApi/GetToken`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          TerminalID: terminalId(),
          Amount: String(sepehrAmountToRial(amount)),
          InvoiceID: invoiceId,
          callbackURL: callbackUrl,
          ...(mobile ? { CellNumber: mobile } : {}),
          payload: PAYLOAD,
        }),
        signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
      });
      const body = (await response.json().catch(() => null)) as {
        Status?: number;
        Accesstoken?: string;
      } | null;

      if (!response.ok || body?.Status !== 0 || !body.Accesstoken) {
        const code = typeof body?.Status === "number" ? body.Status : response.status;
        return { ok: false, code, message: TOKEN_ERRORS[code] ?? "سپهر درخواست پرداخت را رد کرد" };
      }

      const token = body.Accesstoken;
      return {
        ok: true,
        authority: invoiceId,
        gatewayToken: token,
        paymentUrl: sepehrGateway.buildPaymentUrl({ authority: invoiceId, gatewayToken: token }),
      };
    } catch {
      return { ok: false, code: 0, message: "ارتباط با درگاه پرداخت برقرار نشد" };
    }
  },

  buildPaymentUrl({ gatewayToken }) {
    if (!gatewayToken) throw new Error("Sepehr payment URL needs a gateway token");
    const url = new URL(`${baseUrl()}/Payment/Pay`);
    url.searchParams.set("token", gatewayToken);
    url.searchParams.set("terminalId", terminalId());
    return url.toString();
  },

  extractReceipt(callbackData) {
    const receipt = callbackData?.digitalreceipt?.trim();
    return receipt && RECEIPT_PATTERN.test(receipt) ? receipt : null;
  },

  async verifyPayment({ amount, authority, callbackData }) {
    const data = callbackData;
    // بدون داده‌ی Callback (مثلاً Cron) قابل Verify نیست: رسید دیجیتال لازم است.
    if (!data) {
      return { success: false, code: -1000, message: "داده‌ی بازگشت از درگاه موجود نیست", retryable: true, unconfirmed: false };
    }

    // Callback جعلی/ناسازگار: بدون اثر مالی، بدون تغییر وضعیت.
    const ignore = (message: string) => ({
      success: false as const,
      code: -1001,
      message,
      retryable: true,
      unconfirmed: false,
    });
    if (data.invoiceid !== authority) return ignore("شناسه فاکتور با رکورد مطابقت ندارد");
    if (data.terminalid && data.terminalid !== terminalId()) return ignore("شماره پایانه مطابقت ندارد");

    const respcode = Number(data.respcode);
    if (!Number.isInteger(respcode)) return ignore("کد پاسخ درگاه نامعتبر است");
    if (respcode !== 0) {
      const message =
        respcode === -1 ? "پرداخت توسط کاربر لغو شد" : respcode === -2 ? "زمان پرداخت به پایان رسید" : "پرداخت ناموفق بود";
      return { success: false, code: respcode, message, retryable: false, unconfirmed: false };
    }

    const receipt = this.extractReceipt?.(data) ?? null;
    if (!receipt) return ignore("رسید دیجیتال نامعتبر است");

    const expectedRial = sepehrAmountToRial(amount);
    // مبلغ Callback قابل جعل است؛ ناسازگاری یعنی Advice نمی‌زنیم (سپهر پس از ۳۰ دقیقه خودکار برمی‌گرداند).
    if (data.amount && Number(data.amount) !== expectedRial) return ignore("مبلغ بازگشتی با مبلغ ثبت‌شده مطابقت ندارد");

    try {
      const response = await fetch(`${baseUrl()}/Rest/V1/PeymentApi/AdviceWithInvoicId`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ digitalreceipt: receipt, Tid: Number(terminalId()), InvoiceID: authority }),
        signal: AbortSignal.timeout(SEPEHR_VERIFY_TIMEOUT_MS),
      });
      const body = (await response.json().catch(() => null)) as {
        Status?: string;
        ReturnId?: string;
        Message?: string;
      } | null;
      const status = body?.Status?.toLowerCase();

      if (status === "ok" || status === "duplicate") {
        // Duplicate = همین Advice قبلاً زده شده (Retry بعد از شکست DB) — موفق، مثل کد ۱۰۱ زرین‌پال.
        if (Number(body?.ReturnId) !== expectedRial) {
          return {
            success: false,
            code: -1002,
            message: "مبلغ تأییدشده توسط درگاه با مبلغ ثبت‌شده مطابقت ندارد",
            retryable: false,
            unconfirmed: true,
          };
        }
        const rrn = Number(data.rrn);
        return {
          success: true,
          refId: Number.isSafeInteger(rrn) && rrn > 0 ? rrn : null,
          cardPan: data.cardnumber || null,
          digitalReceipt: receipt,
        };
      }

      if (status === "nok") {
        const code = Number(body?.ReturnId);
        // -3 = خطای عمومی (موقت). بقیه کدها معنی رسمی‌شان با پاسخ واقعی تأیید نشده → بررسی دستی، بدون شکست/استرداد خودکار.
        if (code === -3) return { success: false, code, message: "خطای موقت درگاه", retryable: true, unconfirmed: false };
        return {
          success: false,
          code: Number.isFinite(code) ? code : -1003,
          message: body?.Message || "تأیید پرداخت توسط درگاه پذیرفته نشد",
          retryable: false,
          unconfirmed: true,
        };
      }

      return { success: false, code: -1004, message: "پاسخ نامعتبر از درگاه", retryable: true, unconfirmed: false };
    } catch (error) {
      const timedOut = error instanceof Error && error.name === "TimeoutError";
      return {
        success: false,
        code: 0,
        message: timedOut ? "زمان انتظار پاسخ درگاه پرداخت تمام شد" : "ارتباط با درگاه پرداخت برقرار نشد",
        retryable: true,
        unconfirmed: false,
      };
    }
  },
};
