import {
  getZarinpalStartPayUrl,
  requestZarinpalPayment,
  verifyZarinpalPayment,
} from "@/lib/payment/zarinpal";
import { isUnconfirmedVerifyFailureCode } from "@/lib/payment/verify-failure-codes";
import type { PaymentGateway } from "@/lib/payment/gateways/types";

/**
 * Adapter زرین‌پال — فقط توابع موجود `zarinpal.ts` را به قرارداد مشترک
 * وصل می‌کند؛ رفتار زرین‌پال تغییر نکرده است.
 */
export const zarinpalGateway: PaymentGateway = {
  id: "zarinpal",

  async requestPayment(params) {
    const result = await requestZarinpalPayment(params);
    if (!("authority" in result)) return { ok: false, code: result.code, message: result.message };
    return { ok: true, authority: result.authority, paymentUrl: result.paymentUrl };
  },

  buildPaymentUrl({ authority }) {
    return getZarinpalStartPayUrl(authority);
  },

  async verifyPayment({ amount, authority }) {
    const result = await verifyZarinpalPayment({ amount, authority });
    if (result.success) {
      return { success: true, refId: result.refId, cardPan: result.cardPan };
    }
    return {
      success: false,
      code: result.code,
      message: result.message,
      retryable: result.retryable,
      unconfirmed: isUnconfirmedVerifyFailureCode(result.code),
    };
  },
};
