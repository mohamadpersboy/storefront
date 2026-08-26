import { z } from "zod";

export const updateDiscountSettingsSchema = z.object({
  onlinePaymentRewardEnabled: z.boolean(),
  onlinePaymentRewardPercentage: z.number().min(0).max(100),
  mixedPaymentRewardEnabled: z.boolean(),
  mixedPaymentRewardPercentage: z.number().min(0).max(100),
});
