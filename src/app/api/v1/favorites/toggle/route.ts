import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { toggleFavoriteSchema } from "@/lib/validations/favorites";
import { Product } from "@/models/Product";
import { Favorite } from "@/models/Favorite";

/**
 * افزودن/حذف یک محصول از علاقه‌مندی‌های کاربر (Toggle) — همان الگوی
 * Auth با Cart (`requireAuthenticatedUser`، بدون نیاز به Permission
 * خاص RBAC، چون منبع متعلق به خود کاربر است، نه Dashboard).
 */
export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = toggleFavoriteSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  const { productId } = parsed.data;
  await connectToDatabase();

  const product = await Product.findOne({
    _id: productId,
    status: "published",
    deletedAt: null,
  })
    .select("_id")
    .lean();

  if (!product) {
    return apiError("این محصول در دسترس نیست", { status: 404 });
  }

  const existing = await Favorite.findOne({ user: guard.user.id, product: productId });

  if (existing) {
    await existing.deleteOne();
    return apiSuccess({ isFavorite: false }, { message: "از علاقه‌مندی‌ها حذف شد" });
  }

  await Favorite.create({ user: guard.user.id, product: productId });
  return apiSuccess({ isFavorite: true }, { message: "به علاقه‌مندی‌ها اضافه شد" });
}
