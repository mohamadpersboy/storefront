import mongoose, { Schema, type Model, type Types } from "mongoose";

export type WalletTransactionType = "credit" | "debit";

/**
 * یک ردیف Append-only به ازای هر تغییر موجودی — دقیقاً مشابه الگوی
 * `ActivityLog` (بند ۵۳)، تا هر تغییر موجودی کیف پول قابل ردیابی
 * باشد (چه کسی، چه زمانی، چرا، موجودی قبل/بعد).
 */
export interface IWalletTransaction {
  wallet: Types.ObjectId;
  user: Types.ObjectId;
  type: WalletTransactionType;
  amount: number; // همیشه مثبت؛ جهت از روی `type` مشخص می‌شود
  balanceAfter: number; // اسنپ‌شات موجودی بعد از این تراکنش
  reason: string;
  performedBy: Types.ObjectId; // ادمینی که این تعدیل دستی را انجام داده
  createdAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>({
  wallet: { type: Schema.Types.ObjectId, ref: "Wallet", required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  amount: { type: Number, required: true, min: 0 },
  balanceAfter: { type: Number, required: true, min: 0 },
  reason: { type: String, required: true, trim: true },
  performedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

type WalletTransactionModel = Model<IWalletTransaction>;

export const WalletTransaction: WalletTransactionModel =
  (mongoose.models.WalletTransaction as WalletTransactionModel) ||
  mongoose.model<IWalletTransaction, WalletTransactionModel>(
    "WalletTransaction",
    WalletTransactionSchema,
  );
