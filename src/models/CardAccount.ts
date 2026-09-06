import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/**
 * A store card/bank account used to receive card-to-card (کارت به کارت)
 * payments (Master Prompt Phase ۲, بند ۱). Kept independent from
 * `Bank` — a store account isn't necessarily one-per-bank and the
 * fields needed (card number/account number/owner name) don't overlap
 * with `Bank`'s own purpose (a reference list used when registering a
 * received Check). No DELETE on purpose: an old card/account may
 * still be referenced by historical Payments once Phase ۲'s
 * Payment↔CardAccount link exists.
 */
export interface ICardAccount {
  cardNumber: string;
  accountNumber: string;
  ownerName: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CardAccountDocument = HydratedDocument<ICardAccount>;

const CardAccountSchema = new Schema<ICardAccount>(
  {
    cardNumber: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    ownerName: { type: String, required: true, trim: true, minlength: 2 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type CardAccountModel = Model<ICardAccount>;

export const CardAccount: CardAccountModel =
  (mongoose.models.CardAccount as CardAccountModel) ||
  mongoose.model<ICardAccount, CardAccountModel>("CardAccount", CardAccountSchema);
