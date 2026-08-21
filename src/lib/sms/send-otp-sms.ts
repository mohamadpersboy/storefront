import { env } from "@/config/env";

const SMS_IR_SEND_URL = "https://api.sms.ir/v1/send/bulk";

/**
 * Sends a custom OTP message via sms.ir's Bulk send method (not the
 * ready-made "verify" template) so we control the exact message text.
 * Docs: https://apidocs.sms.ir/ — POST /v1/send/bulk, header X-API-KEY.
 */
export async function sendOtpSms(
  phoneNumber: string,
  code: string,
): Promise<void> {
  const messageText = `کد ورود شما به فرش سقطچی: ${code}\nاین کد تا ۲ دقیقه معتبر است.`;

  const response = await fetch(SMS_IR_SEND_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": env.SMS_IR_API_KEY,
    },
    body: JSON.stringify({
      lineNumber: Number(env.SMS_IR_LINE_NUMBER),
      messageText,
      mobiles: [phoneNumber],
      sendDateTime: null,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `sms.ir request failed (${response.status}): ${errorBody}`,
    );
  }

  const data: { status?: number; message?: string } = await response.json();

  // sms.ir returns status 1 on success for this endpoint.
  if (data.status !== 1) {
    throw new Error(`sms.ir rejected the request: ${data.message ?? "unknown error"}`);
  }
}
