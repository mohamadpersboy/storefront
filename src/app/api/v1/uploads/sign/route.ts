import { cloudinary, PRODUCT_IMAGES_FOLDER } from "@/lib/cloudinary/config";
import { PERMISSIONS } from "@/lib/constants/rbac";
import { requireApiUser } from "@/lib/auth/api-guard";
import { apiSuccess } from "@/lib/utils/api-response";
import { env } from "@/config/env";

/**
 * Returns a signed set of upload parameters the browser can send
 * directly to Cloudinary (https://api.cloudinary.com/v1_1/<cloud>/image/upload).
 * The API secret never leaves the server — only a signature computed
 * from it, valid for this one upload request.
 */
export async function POST() {
  const guard = await requireApiUser(PERMISSIONS.PRODUCTS_CREATE);
  if (guard.response) return guard.response;

  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: PRODUCT_IMAGES_FOLDER };

  const signature = cloudinary.utils.api_sign_request(
    paramsToSign,
    env.CLOUDINARY_API_SECRET,
  );

  return apiSuccess({
    timestamp,
    signature,
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder: PRODUCT_IMAGES_FOLDER,
  });
}
