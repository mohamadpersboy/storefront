import {
  cloudinary,
  PRODUCT_IMAGES_FOLDER,
  BANK_LOGOS_FOLDER,
  BANNER_IMAGES_FOLDER,
  CATEGORY_IMAGES_FOLDER,
  BRAND_IMAGES_FOLDER,
  NOTIFICATION_IMAGES_FOLDER,
} from "@/lib/cloudinary/config";
import { connectToDatabase } from "@/lib/db/connect";
import { reviewImageFolderForUser } from "@/lib/reviews/images";
import { checkReviewImageUploadEligibility } from "@/lib/reviews/service";
import { reviewImageSignSchema } from "@/lib/validations/reviews";
import { PERMISSIONS, type Permission } from "@/lib/constants/rbac";
import { requireApiUser, requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { env } from "@/config/env";

type UploadTarget =
  | "product-image"
  | "bank-logo"
  | "banner-image"
  | "category-image"
  | "brand-image"
  | "notification-image";

const TARGET_CONFIG: Record<UploadTarget, { folder: string; permission: Permission }> = {
  "product-image": { folder: PRODUCT_IMAGES_FOLDER, permission: PERMISSIONS.PRODUCTS_CREATE },
  "bank-logo": { folder: BANK_LOGOS_FOLDER, permission: PERMISSIONS.BANKS_MANAGE },
  "banner-image": { folder: BANNER_IMAGES_FOLDER, permission: PERMISSIONS.SETTINGS_MANAGE },
  "category-image": {
    folder: CATEGORY_IMAGES_FOLDER,
    permission: PERMISSIONS.CATEGORIES_CREATE,
  },
  "brand-image": {
    folder: BRAND_IMAGES_FOLDER,
    permission: PERMISSIONS.BRANDS_CREATE,
  },
  "notification-image": {
    folder: NOTIFICATION_IMAGES_FOLDER,
    permission: PERMISSIONS.NOTIFICATIONS_MANAGE,
  },
};

/**
 * Returns a signed set of upload parameters the browser can send
 * directly to Cloudinary (https://api.cloudinary.com/v1_1/<cloud>/image/upload).
 * The API secret never leaves the server — only a signature computed
 * from it, valid for this one upload request.
 *
 * `target` selects the destination folder + the permission required to
 * upload there (default: product images, kept backward-compatible with
 * the original single-purpose behavior of this route).
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);

  // Customer-aware: هر کاربر Login‌شده فقط در صورت «خریدار بودن همین
  // محصول» امضای آپلود می‌گیرد؛ پوشه اختصاصی کاربر مالکیت را ثابت می‌کند.
  if (body?.target === "review-image") {
    const authGuard = await requireAuthenticatedUser();
    if (authGuard.response) return authGuard.response;

    const parsed = reviewImageSignSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("اطلاعات وارد شده نامعتبر است", {
        status: 422,
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    await connectToDatabase();
    const eligibility = await checkReviewImageUploadEligibility(authGuard.user.id, parsed.data.productId);
    if (!eligibility.ok) return apiError(eligibility.message, { status: eligibility.status });

    return signFor(reviewImageFolderForUser(authGuard.user.id));
  }

  const target: UploadTarget =
    body?.target === "bank-logo"
      ? "bank-logo"
      : body?.target === "banner-image"
        ? "banner-image"
        : body?.target === "category-image"
          ? "category-image"
          : body?.target === "brand-image"
            ? "brand-image"
            : body?.target === "notification-image"
              ? "notification-image"
              : "product-image";
  const config = TARGET_CONFIG[target];

  const guard = await requireApiUser(config.permission);
  if (guard.response) return guard.response;

  return signFor(config.folder);
}

function signFor(folder: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET,
  );

  return apiSuccess({
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
  });
}
