import { afterAll, beforeAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { createOrder } from "@/lib/orders/create-order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { Coupon } from "@/models/Coupon";
import { CouponRedemption } from "@/models/CouponRedemption";

const newId = () => new mongoose.Types.ObjectId();
const tag = `itest${Date.now()}`;
const productIds: mongoose.Types.ObjectId[] = [];
const userIds: mongoose.Types.ObjectId[] = [];
const couponIds: mongoose.Types.ObjectId[] = [];
let phoneSeq = 0;

const address = {
  recipientName: "تست",
  phoneNumber: "09120000000",
  province: "تهران",
  city: "تهران",
  addressLine: "آدرس آزمایشی",
  postalCode: "1234567890",
};

async function makeUser() {
  const u = await User.create({ phoneNumber: `0990${String(Date.now()).slice(-6)}${phoneSeq++}`.slice(0, 11) });
  userIds.push(u._id);
  return String(u._id);
}

async function makeProduct(stock: number) {
  const p = await Product.create({
    title: `محصول ${tag}`,
    slug: `${tag}-${productIds.length}`,
    category: newId(),
    status: "published",
    variants: [{ unit: "تخته", price: 100000, stock, isActive: true }],
  });
  productIds.push(p._id);
  return { productId: String(p._id), variantId: String(p.variants[0]._id), id: p._id };
}

beforeAll(async () => {
  await connectToDatabase();
  await CouponRedemption.syncIndexes();
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await Order.deleteMany({ customer: { $in: userIds } });
    await CouponRedemption.deleteMany({ user: { $in: userIds } });
    await Coupon.deleteMany({ _id: { $in: couponIds } });
    await Product.deleteMany({ _id: { $in: productIds } });
    await User.deleteMany({ _id: { $in: userIds } });
  }
  await mongoose.disconnect();
});

describe("Mongo واقعی: رقابت موجودی انبار", () => {
  it("۱۰ سفارش هم‌زمان برای ۳ عدد موجودی ← حداکثر ۳ سفارش موفق و موجودی منفی نمی‌شود", async () => {
    const { productId, variantId, id } = await makeProduct(3);
    const customers = await Promise.all(Array.from({ length: 10 }, makeUser));

    const results = await Promise.allSettled(
      customers.map((customerId) =>
        createOrder({
          customerId,
          items: [{ productId, variantId, quantity: 1 }],
          shippingAddress: address,
          shippingCost: 0,
          paymentMethod: "cash",
          actorId: customerId,
        }),
      ),
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const stock = (await Product.findById(id))!.variants[0].stock;
    expect(stock).toBeGreaterThanOrEqual(0);
    expect(ok).toBeLessThanOrEqual(3);
    expect(ok + stock).toBe(3);
  });
});

describe("Mongo واقعی: رقابت سقف استفاده هر کاربر از کد تخفیف", () => {
  it("۸ سفارش هم‌زمان یک کاربر با کد perUserLimit=1 ← فقط یک استفاده", async () => {
    const { productId, variantId } = await makeProduct(100);
    const customerId = await makeUser();
    const coupon = await Coupon.create({
      code: `T${tag}`.toUpperCase(),
      discountPercentage: 10,
      expiresAt: new Date(Date.now() + 86_400_000),
      perUserLimit: 1,
    });
    couponIds.push(coupon._id);

    const results = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        createOrder({
          customerId,
          items: [{ productId, variantId, quantity: 1 }],
          shippingAddress: address,
          shippingCost: 0,
          paymentMethod: "cash",
          couponCode: coupon.code,
          actorId: customerId,
        }),
      ),
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const redemptions = await CouponRedemption.countDocuments({ coupon: coupon._id, user: customerId });
    expect(ok).toBe(1);
    expect(redemptions).toBe(1);
  });
});
