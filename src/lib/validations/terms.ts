import { z } from "zod";

export const updateTermsSchema = z.object({
  title: z.string().trim().min(2, "عنوان باید حداقل ۲ حرف باشد").max(200),
  content: z.string().trim().min(1, "متن قوانین و مقررات نمی‌تواند خالی باشد"),
});

export type UpdateTermsInput = z.infer<typeof updateTermsSchema>;
