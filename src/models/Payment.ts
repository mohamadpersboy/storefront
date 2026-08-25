import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";

export type PaymentProvider = "zarinpal";

export type PaymentStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled"
  | "refunded"
  | "partially_paid";

export const PAYMENT_STATUSES: PaymentStatus[] = [
  "pending",
  "processing",
  "paid",
  "failed",
  "cancelled",
  "refunded",
  "partially_paid",
];

export interface IPayment {
  order: Types.ObjectId;
  amount: number; // Tomans — the online portion being collected through the gateway
  provider: PaymentProvider;
  status: PaymentStatus;
  authority: string; // Zarinpal transaction identifier, issued at request time
  refId: number | null; // Zarinpal reference number, only set once paid
  cardPan: string | null; // masked card number returned by Zarinpal on verify
  description: string;
  initiatedBy: Types.ObjectId; // staff/admin who generated the payment link
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
    provider: { type: String, enum: ["zarinpal"], default: "zarinpal", required: true },
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
