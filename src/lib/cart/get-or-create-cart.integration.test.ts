/**
 * تست یکپارچه با MongoDB واقعی. فقط وقتی اجرا می‌شود که
 * CART_INTEGRATION_MONGODB_URI به دیتابیس اختصاصی `carpet_integration_test`
 * اشاره کند؛ وگرنه Skip می‌شود (و در گزارش «NOT VERIFIED» است).
 */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose, { Types } from "mongoose";

const uri = process.env.CART_INTEGRATION_MONGODB_URI;
const safe = !!uri && new URL(uri).pathname === "/carpet_integration_test";

describe.skipIf(!safe)("getOrCreateCart روی MongoDB واقعی", () => {
  beforeAll(async () => {
    await mongoose.connect(uri as string);
    const { Cart } = await import("@/models/Cart");
    await Cart.init();
  });
  afterAll(async () => {
    const { Cart } = await import("@/models/Cart");
    await Cart.deleteMany({ user: { $in: created } });
    await mongoose.disconnect();
  });
  const created: Types.ObjectId[] = [];

  it("۵۰ فراخوانی هم‌زمان برای یک کاربر دقیقاً یک سبد می‌سازد", async () => {
    const { getOrCreateCart } = await import("@/lib/cart/cart-service");
    const { Cart } = await import("@/models/Cart");
    const user = new Types.ObjectId();
    created.push(user);
    const carts = await Promise.all(Array.from({ length: 50 }, () => getOrCreateCart(user.toString())));
    expect(new Set(carts.map((c) => String(c._id))).size).toBe(1);
    expect(await Cart.countDocuments({ user })).toBe(1);
  });

  it("سبد موجود (آیتم/مجموع/کوپن) و updatedAt را تغییر نمی‌دهد", async () => {
    const { getOrCreateCart } = await import("@/lib/cart/cart-service");
    const { Cart } = await import("@/models/Cart");
    const user = new Types.ObjectId();
    created.push(user);
    const coupon = new Types.ObjectId();
    const seeded = await Cart.create({
      user,
      items: [{ product: new Types.ObjectId(), variantId: new Types.ObjectId(), quantity: 3 }],
      cartTotal: 900,
      appliedCoupon: { coupon, code: "ABC" },
    });
    await Promise.all(Array.from({ length: 10 }, () => getOrCreateCart(user.toString())));
    const after = await Cart.findById(seeded._id);
    expect(after?.items).toHaveLength(1);
    expect(after?.cartTotal).toBe(900);
    expect(after?.appliedCoupon?.code).toBe("ABC");
    expect(after?.updatedAt.getTime()).toBe(seeded.updatedAt.getTime());
  });

  it("سبد جدید timestamps و مقادیر پیش‌فرض دارد", async () => {
    const { getOrCreateCart } = await import("@/lib/cart/cart-service");
    const user = new Types.ObjectId();
    created.push(user);
    const cart = await getOrCreateCart(user.toString());
    expect(cart.items).toHaveLength(0);
    expect(cart.cartTotal).toBe(0);
    expect(cart.appliedCoupon).toBeNull();
    expect(cart.createdAt).toBeInstanceOf(Date);
    expect(cart.updatedAt).toBeInstanceOf(Date);
  });
});
