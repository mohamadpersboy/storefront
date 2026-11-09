/**
 * قرارداد مشترک درگاه‌های پرداخت آنلاین. هر درگاه جدید (مثلاً به‌پرداخت)
 * فقط یک Adapter است که این Interface را پیاده می‌کند و در `index.ts`
 * ثبت می‌شود؛ منطق مالی (Claim، Idempotency، کیف پول) در
 * `process-gateway-callback.ts` و `process-topup-callback.ts` مشترک می‌ماند.
 *
 * همه مبلغ‌های این Interface «تومان» هستند. تبدیل به ریال (در صورت نیاز
 * درگاه) فقط داخل Adapter همان درگاه انجام می‌شود.
 */
export type OnlineGatewayId = "zarinpal" | "sepehr";

export const ONLINE_GATEWAY_IDS: readonly OnlineGatewayId[] = ["zarinpal", "sepehr"];

export interface GatewayPaymentRequest {
  /** تومان */
  amount: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
}

export type GatewayRequestResult =
  | {
      ok: true;
      /** شناسه یکتای تراکنش در سیستم ما (در `Payment.authority` ذخیره می‌شود) */
      authority: string;
      paymentUrl: string;
      /** توکن درگاه برای ساخت دوباره‌ی لینک پرداخت (فقط درگاه‌هایی که Authority با توکن فرق دارد) */
      gatewayToken?: string;
    }
  | { ok: false; code: number; message: string };

export interface GatewayVerifyInput {
  /** تومان — همیشه از رکورد ذخیره‌شده، هرگز از Callback */
  amount: number;
  authority: string;
  /** پارامترهای خام برگشتی درگاه (Query/Form). فقط درگاه‌هایی که به آن نیاز دارند می‌خوانند. */
  callbackData?: Record<string, string>;
}

export type GatewayVerifyResult =
  | {
      success: true;
      refId: number | null;
      cardPan: string | null;
      /** رسید دیجیتال یکتا (فقط درگاه‌هایی که دارند) */
      digitalReceipt?: string | null;
    }
  | {
      success: false;
      code: number;
      message: string;
      /** نتیجه قطعی نیست؛ Payment باید `pending` بماند و تلاش بعدی دوباره Verify کند. */
      retryable: boolean;
      /** کد خطا معنی رسمی تأییدشده ندارد؛ `pending` + بررسی دستی، بدون استرداد/اعلان شکست. */
      unconfirmed: boolean;
    };

export interface PaymentGateway {
  readonly id: OnlineGatewayId;
  requestPayment(params: GatewayPaymentRequest): Promise<GatewayRequestResult>;
  buildPaymentUrl(params: { authority: string; gatewayToken?: string | null }): string;
  verifyPayment(params: GatewayVerifyInput): Promise<GatewayVerifyResult>;
  /** رسید دیجیتال داخل Callback (قبل از Verify) برای بررسی تکراری‌نبودن. */
  extractReceipt?(callbackData: Record<string, string> | undefined): string | null;
}
