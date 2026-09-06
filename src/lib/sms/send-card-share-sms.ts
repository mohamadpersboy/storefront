import { sendBulkSms } from "@/lib/sms/send-bulk-sms";
import { buildCardShareMessage, type CardShareDetails } from "@/lib/sms/card-share-message";

/** Texts a store CardAccount's details to a customer's phone number. */
export async function sendCardShareSms(
  phoneNumber: string,
  details: CardShareDetails,
): Promise<void> {
  await sendBulkSms(phoneNumber, buildCardShareMessage(details));
}
