import { z } from "zod";

export const updateReferralSettingsSchema = z.object({
  enabled: z.boolean(),
  // null = بدون محدودیت — عمداً nullable نه اختیاری با ۰، تا «نامحدود» با «صفر دعوت مجاز» اشتباه نشود.
  maxReferralsPerUser: z
    .number()
    .int()
    .min(1, "حداقل ۱ دعوت باید مجاز باشد")
    .nullable(),
  rewardDiscountPercentage: z
    .number()
    .min(0, "درصد نمی‌تواند منفی باشد")
    .max(100, "درصد نمی‌تواند بیشتر از ۱۰۰ باشد"),
  rewardMaxDiscountAmount: z.number().min(0, "سقف تخفیف نمی‌تواند منفی باشد").nullable(),
  minInviteeOrderAmount: z.number().min(0, "حداقل مبلغ نمی‌تواند منفی باشد"),
  rewardCouponValidityDays: z.number().int().min(1, "مدت اعتبار باید حداقل ۱ روز باشد"),
});
