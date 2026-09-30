import { cloudinary, REVIEW_IMAGES_FOLDER } from "@/lib/cloudinary/config";
import { env } from "@/config/env";
import {
  REVIEW_IMAGE_ASPECT,
  REVIEW_IMAGE_ASPECT_TOLERANCE,
  REVIEW_MAX_IMAGES,
} from "@/lib/reviews/constants";
import type { IReviewImage } from "@/models/Review";

export interface ReviewImageInput {
  url: string;
  publicId: string;
}

/** پوشه مخصوص آپلود Review یک کاربر — مالکیت تصویر از همین مسیر ثابت می‌شود. */
export function reviewImageFolderForUser(userId: string): string {
  return `${REVIEW_IMAGES_FOLDER}/${userId}`;
}

export interface CloudinaryImageResource {
  resource_type?: string;
  type?: string;
  secure_url?: string;
  public_id?: string;
  width?: number;
  height?: number;
}

export type FetchImageResource = (publicId: string) => Promise<CloudinaryImageResource | null>;

async function defaultFetchResource(publicId: string): Promise<CloudinaryImageResource | null> {
  try {
    return (await cloudinary.api.resource(publicId, {
      resource_type: "image",
      type: "upload",
    })) as CloudinaryImageResource;
  } catch {
    return null;
  }
}

export function isAcceptableAspectRatio(width: number, height: number): boolean {
  if (!(width > 0) || !(height > 0)) return false;
  const ratio = width / height;
  return Math.abs(ratio - REVIEW_IMAGE_ASPECT) / REVIEW_IMAGE_ASPECT <= REVIEW_IMAGE_ASPECT_TOLERANCE;
}

/**
 * بررسی ساختاری (بدون شبکه): HTTPS، Host کلادیناری، مسیر `/image/upload/`
 * برای Cloud خودمان، بدون Transformation، و هم‌خوانی `publicId` با URL.
 */
export function checkImageUrlShape(
  input: ReviewImageInput,
  userId: string,
  cloudName: string = env.CLOUDINARY_CLOUD_NAME,
): string | null {
  let url: URL;
  try {
    url = new URL(input.url);
  } catch {
    return "آدرس تصویر نامعتبر است";
  }
  if (url.protocol !== "https:") return "آدرس تصویر باید HTTPS باشد";
  if (url.hostname !== "res.cloudinary.com") return "تصویر باید از آپلودر سایت باشد";
  if (url.search || url.hash || url.username || url.password) return "آدرس تصویر نامعتبر است";

  const prefix = `/${cloudName}/image/upload/`;
  if (!url.pathname.startsWith(prefix)) return "تصویر باید از آپلودر سایت باشد";

  const segments = url.pathname.slice(prefix.length).split("/");
  if (segments[0] && /^v\d+$/.test(segments[0])) segments.shift();
  let rest: string;
  try {
    rest = decodeURIComponent(segments.join("/"));
  } catch {
    return "آدرس تصویر نامعتبر است";
  }
  const withoutExt = rest.replace(/\.[A-Za-z0-9]+$/, "");
  // اگر Transformation در URL باشد، این مقایسه ناهماهنگ می‌شود و رد می‌شود.
  if (withoutExt !== input.publicId) return "شناسه تصویر با آدرس آن هماهنگ نیست";

  if (!input.publicId.startsWith(`${reviewImageFolderForUser(userId)}/`)) {
    return "تصویر باید توسط خود شما و برای نظر آپلود شده باشد";
  }
  return null;
}

export type ImageValidationResult =
  | { ok: true; images: IReviewImage[] }
  | { ok: false; message: string };

/**
 * اعتبارسنجی کامل تصاویر Review. ابعاد فقط از Cloudinary Admin API
 * گرفته می‌شود؛ هیچ عددی از Client قابل اعتماد نیست.
 */
export async function validateReviewImages(
  inputs: ReviewImageInput[],
  userId: string,
  deps: { fetchResource?: FetchImageResource; cloudName?: string } = {},
): Promise<ImageValidationResult> {
  if (inputs.length === 0) return { ok: true, images: [] };
  if (inputs.length > REVIEW_MAX_IMAGES) {
    return { ok: false, message: `حداکثر ${REVIEW_MAX_IMAGES} تصویر مجاز است` };
  }
  if (new Set(inputs.map((i) => i.publicId)).size !== inputs.length) {
    return { ok: false, message: "تصویر تکراری ارسال شده است" };
  }

  const fetchResource = deps.fetchResource ?? defaultFetchResource;
  const images: IReviewImage[] = [];

  for (const input of inputs) {
    const shapeError = checkImageUrlShape(input, userId, deps.cloudName);
    if (shapeError) return { ok: false, message: shapeError };

    const resource = await fetchResource(input.publicId);
    if (
      !resource ||
      resource.resource_type !== "image" ||
      resource.type !== "upload" ||
      resource.secure_url !== input.url ||
      resource.public_id !== input.publicId
    ) {
      return { ok: false, message: "تصویر معتبر نیست" };
    }
    const { width, height } = resource;
    if (typeof width !== "number" || typeof height !== "number" || !isAcceptableAspectRatio(width, height)) {
      return { ok: false, message: "نسبت تصویر باید ۳:۴ باشد" };
    }
    images.push({ url: input.url, publicId: input.publicId, width, height });
  }

  return { ok: true, images };
}

/** پاک‌سازی Best-effort — هرگز باعث شکست عملیات اصلی نمی‌شود. */
export async function cleanupReviewImages(publicIds: string[]): Promise<void> {
  await Promise.allSettled(
    publicIds.map((id) => cloudinary.uploader.destroy(id, { resource_type: "image" })),
  );
}
