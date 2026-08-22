import { env } from "@/config/env";

const SMS_IR_VERIFY_URL = "https://api.sms.ir/v1/send/verify";

/**
 * Sends the OTP via sms.ir's Pattern/Verify method — the method sms.ir
 * itself recommends for verification codes: it goes out over a
 * service line with high delivery priority and reaches recipients who
 * have opted out of ad/bulk SMS, unlike the plain Bulk method.
 *
 * Requires a pre-approved template in the sms.ir panel (Programmers →
 * Patterns) with a single parameter named "Code". The approved
 * template's numeric ID is SMS_IR_OTP_TEMPLATE_ID.
 * Docs: https://sms.ir/rest-api/ — POST /v1/send/verify.
 */
export async function sendOtpSms(
  phoneNumber: string,
  code: string,
): Promise<void> {
  const response = await fetch(SMS_IR_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": env.SMS_IR_API_KEY,
    },
    body: JSON.stringify({
      mobile: phoneNumber,
      templateId: Number(env.SMS_IR_OTP_TEMPLATE_ID),
      parameters: [{ name: "Code", value: code }],
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
