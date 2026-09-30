import { describe, expect, it, vi } from "vitest";
import {
  checkImageUrlShape,
  isAcceptableAspectRatio,
  reviewImageFolderForUser,
  validateReviewImages,
  type CloudinaryImageResource,
} from "@/lib/reviews/images";

const CLOUD = "test";
const USER = "64b7f0c2a1b2c3d4e5f60719";
const publicId = (n = 1) => `${reviewImageFolderForUser(USER)}/img${n}`;
const url = (n = 1) => `https://res.cloudinary.com/${CLOUD}/image/upload/v1700000000/${publicId(n)}.jpg`;
const input = (n = 1) => ({ url: url(n), publicId: publicId(n) });
const resource = (n = 1, over: Partial<CloudinaryImageResource> = {}): CloudinaryImageResource => ({
  resource_type: "image",
  type: "upload",
  secure_url: url(n),
  public_id: publicId(n),
  width: 600,
  height: 800,
  ...over,
});
const deps = (fn: (id: string) => Promise<CloudinaryImageResource | null>) => ({
  fetchResource: fn,
  cloudName: CLOUD,
});

describe("aspect ratio", () => {
  it("accepts 3:4 within 1% and rejects others", () => {
    expect(isAcceptableAspectRatio(600, 800)).toBe(true);
    expect(isAcceptableAspectRatio(603, 800)).toBe(true); // +0.5%
    expect(isAcceptableAspectRatio(610, 800)).toBe(false); // +1.67%
    expect(isAcceptableAspectRatio(800, 600)).toBe(false);
    expect(isAcceptableAspectRatio(900, 600)).toBe(false); // 3:2
    expect(isAcceptableAspectRatio(0, 800)).toBe(false);
  });
});

describe("checkImageUrlShape", () => {
  it("accepts a valid Cloudinary review image URL", () => {
    expect(checkImageUrlShape(input(), USER, CLOUD)).toBeNull();
  });

  it("rejects http, foreign hosts and other clouds", () => {
    expect(checkImageUrlShape({ ...input(), url: url().replace("https", "http") }, USER, CLOUD)).not.toBeNull();
    expect(checkImageUrlShape({ ...input(), url: url().replace("res.cloudinary.com", "evil.com") }, USER, CLOUD)).not.toBeNull();
    expect(checkImageUrlShape({ ...input(), url: url().replace(`/${CLOUD}/`, "/other/") }, USER, CLOUD)).not.toBeNull();
  });

  it("rejects a publicId that does not match the URL", () => {
    expect(checkImageUrlShape({ ...input(1), publicId: publicId(2) }, USER, CLOUD)).not.toBeNull();
  });

  it("rejects transformations in the URL", () => {
    const withTransform = url().replace("/upload/", "/upload/w_100/");
    expect(checkImageUrlShape({ ...input(), url: withTransform }, USER, CLOUD)).not.toBeNull();
  });

  it("rejects images outside the review folder or another user's folder", () => {
    const foreign = "saghchi-carpet/products/x";
    expect(
      checkImageUrlShape(
        { url: `https://res.cloudinary.com/${CLOUD}/image/upload/v1/${foreign}.jpg`, publicId: foreign },
        USER,
        CLOUD,
      ),
    ).not.toBeNull();
    expect(checkImageUrlShape(input(), "64b7f0c2a1b2c3d4e5f60000", CLOUD)).not.toBeNull();
  });
});

describe("validateReviewImages", () => {
  it("accepts 0, 1 and 2 valid 3:4 images and returns server dimensions", async () => {
    const fetchResource = vi.fn(async (id: string) => resource(id.endsWith("img1") ? 1 : 2));
    expect(await validateReviewImages([], USER, deps(fetchResource))).toEqual({ ok: true, images: [] });

    const one = await validateReviewImages([input(1)], USER, deps(fetchResource));
    expect(one).toMatchObject({ ok: true, images: [{ width: 600, height: 800 }] });

    const two = await validateReviewImages([input(1), input(2)], USER, deps(fetchResource));
    expect(two.ok && two.images).toHaveLength(2);
  });

  it("rejects 3 images and duplicates before calling Cloudinary", async () => {
    const fetchResource = vi.fn();
    expect((await validateReviewImages([input(1), input(2), input(3)], USER, deps(fetchResource))).ok).toBe(false);
    expect((await validateReviewImages([input(1), input(1)], USER, deps(fetchResource))).ok).toBe(false);
    expect(fetchResource).not.toHaveBeenCalled();
  });

  it("rejects wrong aspect ratio and wrong dimensions (server values, not client)", async () => {
    const wrong = await validateReviewImages([input()], USER, deps(async () => resource(1, { width: 900, height: 600 })));
    expect(wrong).toEqual({ ok: false, message: "نسبت تصویر باید ۳:۴ باشد" });
    const missing = await validateReviewImages([input()], USER, deps(async () => resource(1, { width: undefined })));
    expect(missing.ok).toBe(false);
  });

  it("rejects images that Cloudinary does not know or that are not real images", async () => {
    expect((await validateReviewImages([input()], USER, deps(async () => null))).ok).toBe(false);
    expect((await validateReviewImages([input()], USER, deps(async () => resource(1, { resource_type: "video" })))).ok).toBe(false);
    expect((await validateReviewImages([input()], USER, deps(async () => resource(1, { secure_url: "https://res.cloudinary.com/test/image/upload/other.jpg" })))).ok).toBe(false);
  });
});
