import {
  cloudinary,
  PRODUCT_IMAGES_FOLDER,
  BANK_LOGOS_FOLDER,
  BANNER_IMAGES_FOLDER,
} from "@/lib/cloudinary/config";
import { PERMISSIONS, type Permission } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { env } from "@/config/env";

type UploadTarget = "product-image" | "bank-logo" | "banner-image";

const TARGET_CONFIG: Record<UploadTarget, { folder: string; permission: Permission }> = {
  "product-image": { folder: PRODUCT_IMAGES_FOLDER, permission: PERMISSIONS.PRODUCTS_CREATE },
  "bank-logo": { folder: BANK_LOGOS_FOLDER, permission: PERMISSIONS.BANKS_MANAGE },
  "banner-image": { folder: BANNER_IMAGES_FOLDER, permission: PERMISSIONS.SETTINGS_MANAGE },
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
  const target: UploadTarget =
    body?.target === "bank-logo"
      ? "bank-logo"
      : body?.target === "banner-image"
        ? "banner-image"
        : "product-image";
  const config = TARGET_CONFIG[target];

  const guard = await requireApiUser(config.permission);
  if (guard.response) return guard.response;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: config.folder };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET,
  );

  return apiSuccess({
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder: config.folder,
  });
}
