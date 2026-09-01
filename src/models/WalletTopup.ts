import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export type WalletTopupStatus = "pending" | "paid" | "failed";

/**
 * یک تلاش برای شارژ کیف پول از طریق درگاه (Zarinpal) — کاملاً جدا از
 * `Payment` نگه داشته شد، چون `Payment.order` اجباری است (Payment
 * همیشه به یک سفارش وصل است) و شارژ کیف پول اصلاً به سفارشی وصل
 * نیست؛ اجباری‌کردن `order` برای این حالت باعث می‌شد یا Payment
 * معنای دوگانه پیدا کند یا مجبور شویم آن فیلد را Optional کنیم و همه
 * جای دیگر که به `order` اعتماد دارند را بازبینی کنیم.
 */
export interface IWalletTopup {
  user: Types.ObjectId;
  amount: number;
  status: WalletTopupStatus;
  authority: string; // شناسه تراکنش Zarinpal — یکتا
  refId: number | null;
  cardPan: string | null;
  description: string;
  paidAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletTopupDocument = HydratedDocument<IWalletTopup>;

const WalletTopupSchema = new Schema<IWalletTopup>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "paid", "failed"], default: "pending", required: true },
    authority: { type: String, required: true, unique: true },
    refId: { type: Number, default: null },
    cardPan: { type: String, default: null },
    description: { type: String, required: true },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);

type WalletTopupModel = Model<IWalletTopup>;

export const WalletTopup: WalletTopupModel =
  (mongoose.models.WalletTopup as WalletTopupModel) ||
  mongoose.model<IWalletTopup, WalletTopupModel>("WalletTopup", WalletTopupSchema);
