import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/models/SocialLinks";

const socialLinkSchema = z
  .object({
    platform: z.enum(SOCIAL_PLATFORMS),
    url: z.union([z.string().trim().url("آدرس معتبر نیست"), z.literal("")]),
    isActive: z.boolean(),
  })
  .refine((link) => !link.isActive || link.url.length > 0, {
    message: "برای فعال‌سازی یک شبکه اجتماعی، ابتدا آدرس آن را وارد کنید",
    path: ["url"],
  });

export const updateSocialLinksSchema = z
  .object({
    links: z.array(socialLinkSchema).length(SOCIAL_PLATFORMS.length),
  })
  .refine(
    (data) => {
      const platforms = data.links.map((l) => l.platform);
      return new Set(platforms).size === platforms.length &&
        SOCIAL_PLATFORMS.every((p) => platforms.includes(p));
    },
    { message: "دقیقاً یک ورودی برای هر شبکه اجتماعی لازم است", path: ["links"] },
  );

export type UpdateSocialLinksInput = z.infer<typeof updateSocialLinksSchema>;
