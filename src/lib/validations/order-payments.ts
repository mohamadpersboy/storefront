import { z } from "zod";
import { createCheckSchema } from "@/lib/validations/checks";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const objectId = z.string().regex(objectIdRegex, "شناسه معتبر نیست");
const positiveAmount = z
  .number()
  .int("مبلغ باید عدد صحیح باشد")
  .positive("مبلغ باید بزرگ‌تر از صفر باشد");

/**
 * Records how an admin received money against an Order (Master
 * Prompt — Financial Management, Phase ۲، بند ۳). Only cash/pos/
 * card_transfer/check are accepted here — "zarinpal" payments are
 * still created exclusively through the existing
 * `/api/v1/payments/initiate` flow, untouched by this Phase.
 *
 * For `method: "check"`, the client never supplies `amount` — it's
 * always derived server-side from the Check's own registered amount
 * (existing or newly-created), so the amount actually assigned to the
 * order can never diverge from the check itself (بند ۹ اصل کلی سند:
 * «قیمت ارسال‌شده توسط Client قابل‌اعتماد نباشد»).
 */
export const recordOrderPaymentSchema = z.discriminatedUnion("method", [
  z.object({ method: z.literal("cash"), amount: positiveAmount }),
  z.object({ method: z.literal("pos"), amount: positiveAmount, posTerminalId: objectId }),
  z.object({
    method: z.literal("card_transfer"),
    amount: positiveAmount,
    cardAccountId: objectId,
  }),
  z
    .object({
      method: z.literal("check"),
      checkId: objectId.optional(),
      newCheck: createCheckSchema.optional(),
    })
    .refine((data) => Boolean(data.checkId) !== Boolean(data.newCheck), {
      message: "باید دقیقاً یکی از «انتخاب چک موجود» یا «ثبت چک جدید» مشخص شود",
      path: ["checkId"],
    }),
]);

export type RecordOrderPaymentInput = z.infer<typeof recordOrderPaymentSchema>;
