import { describe, expect, it } from "vitest";
import { updateSocialLinksSchema } from "./social-links";
import { SOCIAL_PLATFORMS } from "@/models/SocialLinks";

function buildLinks(overrides: Partial<Record<(typeof SOCIAL_PLATFORMS)[number], object>> = {}) {
  return SOCIAL_PLATFORMS.map((platform) => ({
    platform,
    url: "",
    isActive: false,
    ...(overrides[platform] ?? {}),
  }));
}

describe("updateSocialLinksSchema", () => {
  it("accepts all-inactive default links", () => {
    const result = updateSocialLinksSchema.safeParse({ links: buildLinks() });
    expect(result.success).toBe(true);
  });

  it("accepts an active link with a valid URL", () => {
    const links = buildLinks({
      instagram: { url: "https://instagram.com/saghchi", isActive: true },
    });
    const result = updateSocialLinksSchema.safeParse({ links });
    expect(result.success).toBe(true);
  });

  it("rejects an active link with an empty URL", () => {
    const links = buildLinks({ instagram: { isActive: true } });
    const result = updateSocialLinksSchema.safeParse({ links });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid URL even when inactive", () => {
    const links = buildLinks({ instagram: { url: "not-a-url" } });
    const result = updateSocialLinksSchema.safeParse({ links });
    expect(result.success).toBe(false);
  });

  it("rejects a missing platform", () => {
    const links = buildLinks().slice(0, SOCIAL_PLATFORMS.length - 1);
    const result = updateSocialLinksSchema.safeParse({ links });
    expect(result.success).toBe(false);
  });

  it("rejects a duplicate platform", () => {
    const links = buildLinks();
    links[1] = { ...links[0] };
    const result = updateSocialLinksSchema.safeParse({ links });
    expect(result.success).toBe(false);
  });
});
