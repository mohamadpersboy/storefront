import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * دفترچه آدرس مستقل هر مشتری (بند «آدرس‌های من» — یکی از موارد
 * «Known Limitations» قبلی در CLAUDE.md: تا امروز فقط
 * `Order.shippingAddress` به‌صورت Embedded/Snapshot وجود داشت، نه
 * چند آدرس ذخیره‌شده برای انتخاب سریع).
 *
 * فیلدهای recipientName/phoneNumber/province/city/addressLine/
 * postalCode/latitude/longitude عمداً همان نام‌ها و همان معنا را با
 * `IShippingAddress` (در `Order.ts`) دارند — همان Schema اعتبارسنجی
 * (`shippingAddressSchema` در validations/orders.ts) با یک
 * `.extend()` برای این مدل هم استفاده می‌شود؛ هدف این است که وقتی
 * Checkout بعداً ساخته شود، تبدیل «یک آدرس ذخیره‌شده» به
 * «Snapshot سفارش» بدون Mapping/تغییر شکل داده انجام شود.
 *
 * `addressType`/`customTitle`/`isDefault` مختص دفترچه آدرس هستند و
 * در Snapshot سفارش معنا ندارند (به همین دلیل داخل `IShippingAddress`
 * نیستند).
 *
 * **چرا `addressType` به‌جای `title` آزاد؟** طبق درخواست کارفرما:
 * عنوان آدرس از یک Input آزاد به یک انتخاب محدود (خانه/محل کار/سایر)
 * تغییر کرد تا هم آیکون مناسب هر آدرس مشخص باشد، هم یکدستی بین
 * آدرس‌های کاربران حفظ شود. `customTitle` فقط وقتی `addressType`
 * برابر `"other"` باشد پر می‌شود (برچسب Persian نمایشی برای
 * `"home"`/`"work"` از خود کد ساخته می‌شود، نه از Database — نگاه
 * کنید `lib/utils/address.ts`).
 */
export const ADDRESS_TYPES = ["home", "work", "other"] as const;
export type AddressType = (typeof ADDRESS_TYPES)[number];

export interface IAddress {
  user: Types.ObjectId;
  addressType: AddressType;
  customTitle: string | null; // فقط وقتی addressType === "other"
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AddressDocument = HydratedDocument<IAddress>;

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    addressType: { type: String, enum: ADDRESS_TYPES, required: true, default: "home" },
    customTitle: { type: String, trim: true, maxlength: 50, default: null },
    recipientName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

type AddressModel = Model<IAddress>;

export const Address: AddressModel =
  (mongoose.models.Address as AddressModel) ||
  mongoose.model<IAddress, AddressModel>("Address", AddressSchema);

