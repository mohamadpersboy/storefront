import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * لینک پرداخت اشتراک‌گذاری‌شده‌ی یک سفارش (`/pay/<token>`). مشتری/پرداخت‌کننده
 * هرگز لینک خام درگاه را نمی‌بیند: صفحه‌ی ما پرداخت را روی سرور شروع می‌کند و
 * بعد از بازگشت از درگاه نتیجه را روی همان صفحه نشان می‌دهد.
 *
 * `token` راز است (۱۹۲ بیت تصادفی)؛ فقط اجازه‌ی دیدن شماره سفارش/مبلغ و
 * «شروع پرداخت» همان سفارش را می‌دهد. هیچ داده شخصی (آدرس/تلفن) از آن خوانده
 * نمی‌شود. رکوردها حذف نمی‌شوند؛ `revokedAt` برای ابطال است.
 */
export interface IPaymentLink {
  order: Types.ObjectId;
  token: string;
  expiresAt: Date;
  createdBy: Types.ObjectId;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentLinkDocument = HydratedDocument<IPaymentLink>;

const PaymentLinkSchema = new Schema<IPaymentLink>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    revokedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const PaymentLink: Model<IPaymentLink> =
  (mongoose.models.PaymentLink as Model<IPaymentLink>) ||
  mongoose.model<IPaymentLink>("PaymentLink", PaymentLinkSchema);
