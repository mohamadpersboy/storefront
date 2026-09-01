import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export type WithdrawalStatus = "pending" | "approved_paid" | "rejected";

export interface IWithdrawalDestination {
  ownerName: string;
  cardNumber: string | null;
  iban: string | null; // شماره شبا با پیشوند IR
}

/**
 * درخواست برداشت به کارت/شبا. چون هیچ API واقعی Payout خودکار (واریز
 * برنامه‌ریزی‌شده بانکی) در این پروژه متصل نیست، این مدل یک "صف
 * بررسی دستی" برای ادمین است: مبلغ همان لحظه ثبت درخواست از موجودی
 * کاربر Atomic کسر می‌شود (تا کاربر نتواند بیشتر از موجودی واقعی‌اش
 * درخواست دهد یا با چند درخواست هم‌زمان دوبار همان مبلغ را خرج کند)،
 * و ادمین بعد از انجام واریز واقعی (خارج از سیستم، با کارت‌به‌کارت یا
 * پایا/ساتنا) وضعیت را "پرداخت‌شده" می‌کند. اگر رد شود، مبلغ به
 * موجودی کاربر برمی‌گردد.
 */
export interface IWithdrawalRequest {
  user: Types.ObjectId;
  amount: number;
  destination: IWithdrawalDestination;
  status: WithdrawalStatus;
  reviewedBy: Types.ObjectId | null;
  reviewNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type WithdrawalRequestDocument = HydratedDocument<IWithdrawalRequest>;

const WithdrawalDestinationSchema = new Schema<IWithdrawalDestination>(
  {
    ownerName: { type: String, required: true, trim: true },
    cardNumber: { type: String, default: null },
    iban: { type: String, default: null },
  },
  { _id: false },
);

const WithdrawalRequestSchema = new Schema<IWithdrawalRequest>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    destination: { type: WithdrawalDestinationSchema, required: true },
    status: {
      type: String,
      enum: ["pending", "approved_paid", "rejected"],
      default: "pending",
      required: true,
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    reviewNote: { type: String, default: null },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

type WithdrawalRequestModel = Model<IWithdrawalRequest>;

export const WithdrawalRequest: WithdrawalRequestModel =
  (mongoose.models.WithdrawalRequest as WithdrawalRequestModel) ||
  mongoose.model<IWithdrawalRequest, WithdrawalRequestModel>(
    "WithdrawalRequest",
    WithdrawalRequestSchema,
  );
