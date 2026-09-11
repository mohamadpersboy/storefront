import { z } from "zod";

export const updateShippingSettingsSchema = z.object({
  freeShippingEnabled: z.boolean(),
  freeShippingThreshold: z.number().min(0, "مبلغ نمی‌تواند منفی باشد"),
});
