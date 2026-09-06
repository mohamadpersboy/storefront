import { env } from "@/config/env";

const SMS_IR_BULK_URL = "https://api.sms.ir/v1/send/bulk";

/**
 * Low-level sms.ir Bulk-method sender (freeform text, no pre-approved
 * template). Shared by every "best-effort notification" SMS in the
 * project (order status, card sharing, ...) so the HTTP/response
 * handling only lives in one place — see CLAUDE.md "از Duplicate
 * Entity جلوگیری کن".
 */
export async function sendBulkSms(phoneNumber: string, messageText: string): Promise<void> {
  const response = await fetch(SMS_IR_BULK_URL, {
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
    throw new Error(`sms.ir bulk request failed (${response.status}): ${errorBody}`);
  }

  const data: { status?: number; message?: string } = await response.json();
  if (data.status !== 1) {
    throw new Error(`sms.ir rejected the request: ${data.message ?? "unknown error"}`);
  }
}
