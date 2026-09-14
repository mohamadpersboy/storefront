import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * اطلاعات بانکی دائمی هر مشتری («اطلاعات بانکی» در صفحه حساب من).
 *
 * این مدل عمداً از `WithdrawalRequest.destination` جداست: مقصد یک
 * درخواست برداشت یک Snapshot لحظه ثبت است (نباید با تغییر بعدی
 * اطلاعات بانکی کاربر، تاریخچه درخواست‌های قبلی عوض شود — دقیقاً
 * همان اصل Snapshot که برای `IOrderDiscount` هم رعایت شده)، در حالی
 * که این مدل «آخرین اطلاعات بانکی ثبت‌شده» کاربر برای استفاده‌های
 * بعدی (مثلاً پیش‌پرشدن خودکار فرم درخواست برداشت) است.
 *
 * هر کاربر فقط یک رکورد دارد (`user` با Unique Index) — فعلاً نیازی
 * به چند کارت/شبا برای هر کاربر گزارش نشده؛ اگر لازم شد، تبدیل به
 * چند-رکوردی (شبیه Address) بدون شکستن این Schema ممکن است.
 */
export interface ICustomerBankAccount {
  user: Types.ObjectId;
  ownerName: string;
  cardNumber: string | null;
  iban: string | null; // شماره شبا با پیشوند IR
  createdAt: Date;
  updatedAt: Date;
}

export type CustomerBankAccountDocument = HydratedDocument<ICustomerBankAccount>;

const CustomerBankAccountSchema = new Schema<ICustomerBankAccount>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    ownerName: { type: String, required: true, trim: true },
    cardNumber: { type: String, default: null },
    iban: { type: String, default: null },
  },
  { timestamps: true },
);

type CustomerBankAccountModel = Model<ICustomerBankAccount>;

export const CustomerBankAccount: CustomerBankAccountModel =
  (mongoose.models.CustomerBankAccount as CustomerBankAccountModel) ||
  mongoose.model<ICustomerBankAccount, CustomerBankAccountModel>(
    "CustomerBankAccount",
    CustomerBankAccountSchema,
  );
