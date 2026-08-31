import type { Types } from "mongoose";
import { Cart, type CartDocument } from "@/models/Cart";
import { Product } from "@/models/Product";
import { recomputeCartItem } from "@/lib/cart/recompute-cart-item";

interface ProductForCart {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  status: string;
  deletedAt: Date | null;
  images: Array<{ url: string }>;
  variants: Array<{
    _id: Types.ObjectId;
    unit: string;
    price: number;
    discountPercent: number;
    discountAmount: number;
    stock: number;
    isActive: boolean;
  }>;
}

/** یک سبد را برای کاربر پیدا می‌کند، یا اگر نداشت خالی می‌سازد. */
export async function getOrCreateCart(userId: string): Promise<CartDocument> {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [], cartTotal: 0 });
  }
  return cart;
}

/**
 * تمام Itemهای یک Cart را از روی وضعیت *زنده* Product/Variant دوباره
 * محاسبه می‌کند (قیمت، تخفیف، در دسترس بودن) و `cartTotal` را
 * به‌روزرسانی می‌کند. سند را Save نمی‌کند — این کار به عهده صدازننده
 * است تا در همان درخواست بتوان بعد از Add/Update هم صدا زد.
 *
 * فقط یک Query برای همه محصولات داخل Cart می‌زند (نه یکی به ازای هر
 * Item) — بند «از N+1 Query جلوگیری کنند» در سند Audit، دقیقاً همین‌جا.
 *
 * خروجی Map محصولات را هم برمی‌گرداند تا لایه Serialize مجبور به
 * Query دوباره برای گرفتن عنوان/تصویر محصول نباشد.
 */
export async function recalculateCart(
  cart: CartDocument,
): Promise<Map<string, ProductForCart>> {
  const productIds = [...new Set(cart.items.map((item) => String(item.product)))];

  const products = (await Product.find({ _id: { $in: productIds } })
    .select("title slug status deletedAt images variants")
    .lean()) as unknown as ProductForCart[];

  const productMap = new Map(products.map((p) => [String(p._id), p]));

  let cartTotal = 0;

  for (const item of cart.items) {
    const product = productMap.get(String(item.product));
    const variant = product?.variants.find((v) => String(v._id) === String(item.variantId));
    const productIsAvailable = product ? product.status === "published" && !product.deletedAt : false;

    const recomputed = recomputeCartItem(
      item.quantity,
      variant
        ? {
            price: variant.price,
            discountPercent: variant.discountPercent,
            discountAmount: variant.discountAmount,
            stock: variant.stock,
            isActive: variant.isActive,
            unit: variant.unit,
          }
        : null,
      productIsAvailable,
    );

    item.unit = recomputed.unit;
    item.unitPrice = recomputed.unitPrice;
    item.discountPercent = recomputed.discountPercent;
    item.discountAmount = recomputed.discountAmount;
    item.finalUnitPrice = recomputed.finalUnitPrice;
    item.itemTotal = recomputed.itemTotal;
    item.isAvailable = recomputed.isAvailable;
    item.unavailableReason = recomputed.unavailableReason;

    if (recomputed.isAvailable) cartTotal += recomputed.itemTotal;
  }

  cart.cartTotal = cartTotal;

  return productMap;
}

export function serializeCart(cart: CartDocument, productMap: Map<string, ProductForCart>) {
  return {
    id: String(cart._id),
    items: cart.items.map((item) => {
      const product = productMap.get(String(item.product));
      return {
        id: String(item._id),
        product: product
          ? {
              id: String(product._id),
              title: product.title,
              slug: product.slug,
              image: product.images[0]?.url ?? null,
            }
          : null,
        variantId: String(item.variantId),
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent,
        discountAmount: item.discountAmount,
        finalUnitPrice: item.finalUnitPrice,
        itemTotal: item.itemTotal,
        isAvailable: item.isAvailable,
        unavailableReason: item.unavailableReason,
      };
    }),
    cartTotal: cart.cartTotal,
    itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    updatedAt: cart.updatedAt,
  };
}
