import { env } from "@/config/env";

const BASE_URL =
  env.ZARINPAL_MODE === "production"
    ? "https://payment.zarinpal.com"
    : "https://sandbox.zarinpal.com";

const START_PAY_BASE_URL =
  env.ZARINPAL_MODE === "production"
    ? "https://payment.zarinpal.com/pg/StartPay"
    : "https://sandbox.zarinpal.com/pg/StartPay";

export function getZarinpalStartPayUrl(authority: string): string {
  return `${START_PAY_BASE_URL}/${authority}`;
}

interface ZarinpalRequestResult {
  authority: string;
  paymentUrl: string;
}

interface ZarinpalRequestError {
  code: number;
  message: string;
}

interface ZarinpalVerifySuccess {
  success: true;
  refId: number;
  cardPan: string | null;
}

interface ZarinpalVerifyFailure {
  success: false;
  code: number;
  message: string;
}

/**
 * Starts a Zarinpal payment session for the given amount (in Tomans —
 * `currency: "IRT"` tells Zarinpal to interpret the amount that way,
 * since every amount elsewhere in this project is stored in Tomans,
 * not Rials).
 */
export async function requestZarinpalPayment(params: {
  amount: number;
  description: string;
  callbackUrl: string;
  mobile?: string;
}): Promise<ZarinpalRequestResult | ZarinpalRequestError> {
  try {
    const response = await fetch(`${BASE_URL}/pg/v4/payment/request.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: env.ZARINPAL_MERCHANT_ID,
        amount: params.amount,
        currency: "IRT",
        description: params.description,
        callback_url: params.callbackUrl,
        metadata: params.mobile ? { mobile: params.mobile } : undefined,
      }),
    });

    const body = await response.json();
    const authority: string | undefined = body?.data?.authority;
    const code: number | undefined = body?.data?.code ?? body?.errors?.code;

    if (!response.ok || !authority || code !== 100) {
      return {
        code: code ?? response.status,
        message: body?.errors?.message ?? "زرین‌پال درخواست پرداخت را رد کرد",
      };
    }

    return { authority, paymentUrl: getZarinpalStartPayUrl(authority) };
  } catch {
    return { code: 0, message: "ارتباط با درگاه پرداخت برقرار نشد" };
  }
}

/**
 * Verifies a completed Zarinpal session. `amount` must be the exact
 * amount the payment was originally requested for — Zarinpal itself
 * checks this server-side, but passing anything the client could
 * influence here would defeat that check, so callers must always pass
 * the amount stored on the Payment record, never one read from the
 * callback's query string.
 */
export async function verifyZarinpalPayment(params: {
  amount: number;
  authority: string;
}): Promise<ZarinpalVerifySuccess | ZarinpalVerifyFailure> {
  try {
    const response = await fetch(`${BASE_URL}/pg/v4/payment/verify.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchant_id: env.ZARINPAL_MERCHANT_ID,
        amount: params.amount,
        currency: "IRT",
        authority: params.authority,
      }),
    });

    const body = await response.json();
    const code: number | undefined = body?.data?.code ?? body?.errors?.code;

    // 100 = freshly verified, 101 = already verified before (still a
    // success — Zarinpal returns this if verify is called twice for
    // the same authority, which the callback route can legitimately do).
    if (code === 100 || code === 101) {
      return {
        success: true,
        refId: body.data.ref_id,
        cardPan: body.data.card_pan ?? null,
      };
    }

    return {
      success: false,
      code: code ?? response.status,
      message: body?.errors?.message ?? "تأیید پرداخت ناموفق بود",
    };
  } catch {
    return { success: false, code: 0, message: "ارتباط با درگاه پرداخت برقرار نشد" };
  }
}
