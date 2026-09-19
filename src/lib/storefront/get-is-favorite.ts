import { connectToDatabase } from "@/lib/db/connect";
import { Favorite } from "@/models/Favorite";

/**
 * وضعیت اولیه علاقه‌مندی محصول برای کاربر فعلی — در خود صفحه (Server
 * Component) خوانده می‌شود تا دکمه از همان اولین Render وضعیت درست
 * را نشان دهد، بدون یک Round-trip اضافه از Client. کاربر مهمان
 * (`userId === null`) همیشه `false` می‌گیرد؛ بدون خطا.
 */
export async function getIsProductFavorited(
  userId: string | null,
  productId: string,
): Promise<boolean> {
  if (!userId) return false;

  await connectToDatabase();
  const existing = await Favorite.exists({ user: userId, product: productId });
  return Boolean(existing);
}
