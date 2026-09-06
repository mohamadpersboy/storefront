import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

/**
 * "zarinpal" = the existing online gateway flow. "manual" = a payment
 * recorded by an admin/staff for an amount collected outside the
 * gateway (cash/POS/card-to-card/check) — Master Prompt — Financial
 * Management, Phase ۲.
 */
export type PaymentProvider = "zarinpal" | "manual";

/**
 * How the money for this Payment was actually received. Only
 * meaningful for `provider: "manual"` — "zarinpal" payments are
 * always `method: "zarinpal"` (Phase ۲, بند ۳).
 */
export type PaymentMethod = "zarinpal" | "cash" | "pos" | "card_transfer" | "check";

export const PAYMENT_METHODS: PaymentMethod[] = [
  "zarinpal",
  "cash",
  "pos",
  "card_transfer",
  "check",
];

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_paid"
  // یک Payment از نوع «چک» که چک متصل به آن عودت داده شده — دیگر به‌
  // عنوان وجه دریافت‌شده محسوب نمی‌شود، اما رکورد Payment هرگز حذف
  // نمی‌شود (Master Prompt Phase ۲، بند ۱۰-۱۱).
  | "returned";

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially_paid",
  "returned",
];

export interface IPayment {
  order: Types.ObjectId;
  amount: number; // Tomans — the online portion being collected through the gateway
  // بخشی که از کیف پول کسر شده (Phase «پرداخت ترکیبی»). جدا از
  // `amount` نگه داشته می‌شود چون `amount` دقیقاً همان مبلغی است که
  // به زرین‌پال درخواست داده شده و Zarinpal.verify باید همان عدد را
  // ببیند؛ جمع این دو، مبلغ کل پرداخت‌شده برای این تلاش است.
  walletAmount: number;
  provider: PaymentProvider;
  method: PaymentMethod;
  status: PaymentStatus;
  authority: string; // Zarinpal transaction identifier, issued at request time — for manual payments, a synthesized unique token (no real Zarinpal authority exists)
  refId: number | null; // Zarinpal reference number, only set once paid
  cardPan: string | null; // masked card number returned by Zarinpal on verify
  description: string;
  initiatedBy: Types.ObjectId; // staff/admin who generated the payment link, or who recorded the manual payment
  // فقط برای method="pos" / "card_transfer" / "check" — Phase ۲
  posTerminal: Types.ObjectId | null;
  cardAccount: Types.ObjectId | null;
  check: Types.ObjectId | null;
  paidAt: Date | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = HydratedDocument<IPayment>;

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: "Order", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    walletAmount: { type: Number, default: 0, min: 0 },
    provider: { type: String, enum: ["zarinpal", "manual"], default: "zarinpal", required: true },
    method: { type: String, enum: PAYMENT_METHODS, default: "zarinpal", required: true },
    status: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
      required: true,
      index: true,
    },
    authority: { type: String, required: true, unique: true },
    refId: { type: Number, default: null },
    cardPan: { type: String, default: null },
    description: { type: String, required: true },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    posTerminal: { type: Schema.Types.ObjectId, ref: "PosTerminal", default: null },
    cardAccount: { type: Schema.Types.ObjectId, ref: "CardAccount", default: null },
    check: { type: Schema.Types.ObjectId, ref: "Check", default: null, index: true },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
  },
  { timestamps: true },
);

PaymentSchema.plugin(mongoosePaginate);

type PaymentModel = Model<IPayment> & PaginateModel<IPayment>;

export const Payment: PaymentModel =
  (mongoose.models.Payment as PaymentModel) ||
  mongoose.model<IPayment, PaymentModel>("Payment", PaymentSchema);
