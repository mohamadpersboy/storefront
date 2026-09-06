import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * A store card/bank account used to receive card-to-card (کارت به کارت)
 * payments (Master Prompt Phase ۲, بند ۱). Kept independent from
 * `Bank` — a store account isn't necessarily one-per-bank — but does
 * *reference* `Bank` (بند ۱ اضافه شده بعداً: امکان ارسال شماره کارت
 * به مشتری، که باید نام بانک را هم شامل شود). No DELETE on purpose:
 * an old card/account may still be referenced by historical Payments.
 *
 * `bank`/`shabaNumber` are optional at the schema level (not
 * `required`) so that any CardAccount saved before this field existed
 * still loads without validation errors — see CLAUDE.md "Mongoose
 * schema defaults don't backfill existing documents". The `/send`
 * endpoint enforces both being present before it will text a card to
 * a customer.
 */
export interface ICardAccount {
  cardNumber: string;
  shabaNumber: string | null;
  bank: Types.ObjectId | null;
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
    shabaNumber: { type: String, default: null, trim: true },
    bank: { type: Schema.Types.ObjectId, ref: "Bank", default: null, index: true },
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
