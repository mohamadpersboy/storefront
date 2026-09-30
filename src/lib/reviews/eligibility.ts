import { Types } from "mongoose";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";

export type ProductReviewState =
  | { ok: false; status: 404 | 403; message: string }
  | { ok: true; productId: string; isVerifiedBuyer: boolean; orderId: string | null };

/**
 * Verified Buyer = سفارشِ همین کاربر، شامل همین محصول، با وضعیت `delivered`.
 * `shipped`/`cancelled`/`returned` خریدار حساب نمی‌شوند. جدیدترین
 * سفارش تحویل‌شده به‌عنوان مرجع (`order`) برگردانده می‌شود.
 */
export async function findDeliveredOrderId(
  userId: string,
  productId: string,
): Promise<string | null> {
  const order = await Order.findOne({
    customer: new Types.ObjectId(userId),
    status: "delivered",
    "items.product": new Types.ObjectId(productId),
  })
    .sort({ createdAt: -1 })
    .select("_id")
    .lean();
  return order ? String(order._id) : null;
}

/**
 * قوانین محصول برای ثبت Review:
 * published → مجاز | archived → فقط خریدار قبلی | draft/حذف‌شده → مجاز نیست.
 * (Product یک Pre-find Hook دارد که حذف‌شده‌ها را از نتیجه بیرون می‌کشد.)
 */
export async function resolveProductReviewState(
  userId: string,
  productId: string,
): Promise<ProductReviewState> {
  const product = await Product.findById(productId).select("status").lean();
  if (!product || product.status === "draft") {
    return { ok: false, status: 404, message: "محصول پیدا نشد" };
  }

  const orderId = await findDeliveredOrderId(userId, productId);
  const isVerifiedBuyer = orderId !== null;

  if (product.status === "archived" && !isVerifiedBuyer) {
    return { ok: false, status: 403, message: "ثبت نظر برای این محصول فقط برای خریداران آن ممکن است" };
  }

  return { ok: true, productId, isVerifiedBuyer, orderId };
}
