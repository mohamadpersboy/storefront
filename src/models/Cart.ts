import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export interface ICartItem {
  _id: Types.ObjectId;
  product: Types.ObjectId;
  variantId: Types.ObjectId; // مطابق _id داخل Product.variants
  quantity: number;
  // بقیه فیلدها همیشه از سرور محاسبه می‌شوند، هرگز از Client گرفته
  // نمی‌شوند (بند ۹-۱۳ سند Audit) — با هر Get/Add/Update/Validate
  // دوباره از روی داده زنده Product بازمحاسبه می‌شوند.
  unit: string;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  finalUnitPrice: number;
  itemTotal: number; // finalUnitPrice * quantity
  // اگر محصول/Variant غیرفعال/حذف شده یا موجودی کافی نباشد (بند ۱۵-۱۶)
  isAvailable: boolean;
  unavailableReason: string | null;
}

export interface ICart {
  // فقط کاربران Login‌شده — تصمیم معماری مستند در CLAUDE.md
  // (بخش Decisions Log، Phase 7).
  user: Types.ObjectId;
  items: ICartItem[];
  cartTotal: number; // مجموع itemTotal فقط برای Itemهای isAvailable
  // فقط یک ارجاع سبک به کد تخفیف اعمال‌شده ذخیره می‌شود (بند ۸ سند
  // Audit، Phase 8: هماهنگی Cart با Discount). مبلغ واقعی تخفیف هرگز
  // این‌جا Persist نمی‌شود — چون باید هر بار از نو (با آخرین
  // cartTotal و آخرین وضعیت خود کد تخفیف) محاسبه شود، دقیقاً به همان
  // دلیلی که قیمت هر Item هم Persist نمی‌شود (بند ۹-۱۳).
  appliedCoupon: { coupon: Types.ObjectId; code: string } | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CartDocument = HydratedDocument<ICart>;

const CartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: Schema.Types.ObjectId, required: true },
  quantity: { type: Number, required: true, min: 1 },
  unit: { type: String, default: "" },
  unitPrice: { type: Number, default: 0, min: 0 },
  discountPercent: { type: Number, default: 0, min: 0, max: 100 },
  discountAmount: { type: Number, default: 0, min: 0 },
  finalUnitPrice: { type: Number, default: 0, min: 0 },
  itemTotal: { type: Number, default: 0, min: 0 },
  isAvailable: { type: Boolean, default: true },
  unavailableReason: { type: String, default: null },
});

const CartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [CartItemSchema], default: [] },
    cartTotal: { type: Number, default: 0, min: 0 },
    appliedCoupon: {
      type: new Schema(
        {
          coupon: { type: Schema.Types.ObjectId, ref: "Coupon", required: true },
          code: { type: String, required: true },
        },
        { _id: false },
      ),
      default: null,
    },
  },
  { timestamps: true },
);

type CartModel = Model<ICart>;

export const Cart: CartModel =
  (mongoose.models.Cart as CartModel) || mongoose.model<ICart, CartModel>("Cart", CartSchema);
