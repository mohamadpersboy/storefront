import { beforeEach, describe, expect, it, vi } from "vitest";
import { Types } from "mongoose";

const findOne = vi.fn();
const findOneAndUpdate = vi.fn();

vi.mock("@/models/Cart", () => ({
  Cart: { findOne: (...a: unknown[]) => findOne(...a), findOneAndUpdate: (...a: unknown[]) => findOneAndUpdate(...a) },
}));
vi.mock("@/models/Product", () => ({ Product: {} }));
vi.mock("@/models/Coupon", () => ({ Coupon: {} }));
vi.mock("@/models/CouponRedemption", () => ({ CouponRedemption: {} }));
vi.mock("@/models/AmazingOffer", () => ({ AmazingOffer: {} }));

import { getOrCreateCart } from "@/lib/cart/cart-service";

const userId = new Types.ObjectId().toString();
const upsertResult = (doc: unknown) => ({ orFail: () => Promise.resolve(doc) });
const dupKey = () => Object.assign(new Error("E11000 duplicate key"), { code: 11000, keyPattern: { user: 1 } });

describe("getOrCreateCart (Mock — این تست‌ها هم‌زمانی واقعی Mongo را ثابت نمی‌کنند)", () => {
  beforeEach(() => {
    findOne.mockReset();
    findOneAndUpdate.mockReset();
  });

  it("سبد موجود را بدون هیچ نوشتنی برمی‌گرداند", async () => {
    const cart = { _id: "c1", items: [{ quantity: 2 }], cartTotal: 500 };
    findOne.mockResolvedValue(cart);
    await expect(getOrCreateCart(userId)).resolves.toBe(cart);
    expect(findOneAndUpdate).not.toHaveBeenCalled();
  });

  it("اگر سبد نبود با Upsert اتمیک و $setOnInsert می‌سازد، نه Cart.create", async () => {
    const created = { _id: "c2", items: [], cartTotal: 0 };
    findOne.mockResolvedValue(null);
    findOneAndUpdate.mockReturnValue(upsertResult(created));
    await expect(getOrCreateCart(userId)).resolves.toBe(created);
    const [filter, update, options] = findOneAndUpdate.mock.calls[0];
    expect(filter).toEqual({ user: userId });
    expect(Object.keys(update)).toEqual(["$setOnInsert"]);
    expect(update.$setOnInsert).toMatchObject({ items: [], cartTotal: 0, appliedCoupon: null });
    expect(options).toMatchObject({ upsert: true, returnDocument: "after", timestamps: false });
  });

  it("روی E11000 مربوط به user سبد برنده را دوباره می‌خواند", async () => {
    const winner = { _id: "c3", items: [{ quantity: 1 }] };
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(dupKey()) });
    await expect(getOrCreateCart(userId)).resolves.toBe(winner);
  });

  it("اگر بعد از E11000 هم سبدی پیدا نشد، خطا را پنهان نمی‌کند", async () => {
    findOne.mockResolvedValue(null);
    const err = dupKey();
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(err) });
    await expect(getOrCreateCart(userId)).rejects.toBe(err);
  });

  it("خطاهای نامرتبط (از جمله E11000 روی Index دیگر) را بدون تغییر پرتاب می‌کند", async () => {
    findOne.mockResolvedValue(null);
    const other = new Error("network down");
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(other) });
    await expect(getOrCreateCart(userId)).rejects.toBe(other);
    const otherDup = Object.assign(new Error("dup"), { code: 11000, keyPattern: { slug: 1 } });
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(otherDup) });
    await expect(getOrCreateCart(userId)).rejects.toBe(otherDup);
    expect(findOne).toHaveBeenCalledTimes(2); // فقط خواندن اولیه؛ بدون Recovery
  });

  it("userId نامعتبر را قبل از هر Query رد می‌کند", async () => {
    await expect(getOrCreateCart("not-an-id")).rejects.toThrow();
    expect(findOne).not.toHaveBeenCalled();
  });

  it("اگر E11000 بدون keyPattern بود ولی پیام Index `user_1` داشت، Recovery می‌کند", async () => {
    const winner = { _id: "c4" };
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(winner);
    const err = Object.assign(new Error("E11000 duplicate key error collection: store.carts index: user_1 dup key"), { code: 11000 });
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(err) });
    await expect(getOrCreateCart(userId)).resolves.toBe(winner);
  });

  it("E11000 بدون keyPattern و با Index دیگر Recovery نمی‌شود", async () => {
    findOne.mockResolvedValue(null);
    const err = Object.assign(new Error("E11000 duplicate key error collection: store.carts index: slug_1"), { code: 11000 });
    findOneAndUpdate.mockReturnValue({ orFail: () => Promise.reject(err) });
    await expect(getOrCreateCart(userId)).rejects.toBe(err);
    expect(findOne).toHaveBeenCalledTimes(1);
  });

  it("رشته ۱۲ نویسه‌ای (که ObjectId.isValid می‌پذیرد) را رد می‌کند", async () => {
    await expect(getOrCreateCart("abcdefghijkl")).rejects.toThrow();
    expect(findOne).not.toHaveBeenCalled();
  });
});
