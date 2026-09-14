import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(100),
});
