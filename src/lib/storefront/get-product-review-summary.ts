import { connectToDatabase } from "@/lib/db/connect";
import { getProductReviewStats } from "@/lib/reviews/queries";
import { toPublicReviewStats, type PublicReviewStats } from "@/lib/reviews/public-serialize";

/**
 * Stats خلاصه برای Render اولیه (Server Component). خطا نباید کل صفحه
 * محصول را بیندازد — در خطا `null` برمی‌گرداند و کارت Review رندر نمی‌شود.
 */
export async function getProductReviewSummary(productId: string): Promise<PublicReviewStats | null> {
  try {
    await connectToDatabase();
    return toPublicReviewStats(await getProductReviewStats(productId));
  } catch (error) {
    console.error("getProductReviewSummary failed:", error);
    return null;
  }
}
