import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export interface IWallet {
  user: Types.ObjectId; // یکتا — هر کاربر دقیقاً یک کیف پول
  balance: number; // همیشه >= ۰
  createdAt: Date;
  updatedAt: Date;
}

export type WalletDocument = HydratedDocument<IWallet>;

const WalletSchema = new Schema<IWallet>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

type WalletModel = Model<IWallet>;

export const Wallet: WalletModel =
  (mongoose.models.Wallet as WalletModel) ||
  mongoose.model<IWallet, WalletModel>("Wallet", WalletSchema);
