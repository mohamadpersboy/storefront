import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

export type WalletTopupStatus = "pending" | "processing" | "paid" | "failed";

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
  /** Claim پردازش Callback؛ فقط مالک Token می‌تواند نهایی کند. */
  processingToken?: string | null;
  processingStartedAt?: Date | null;
  /** توضیح Reconciliation (مثلاً کد خطای تأییدنشده). فقط اطلاعات است؛ رکورد را از صف Cron خارج نمی‌کند. */
  reconciliationNote?: string | null;
  /** true = نیاز به بررسی دستی (کد خطای تأییدنشده یا قدیمی‌تر از سقف بررسی خودکار). با پرداخت موفق false می‌شود. */
  needsManualReview?: boolean;
  /** آخرین زمان Claim/تلاش Verify. برای چرخش عادلانه صف Cron (null/نبود = هرگز بررسی نشده، اول صف). */
  lastReconcileAt?: Date | null;
  reconcileAttempts?: number;
  createdAt: Date;
  updatedAt: Date;
}

export type WalletTopupDocument = HydratedDocument<IWalletTopup>;

const WalletTopupSchema = new Schema<IWalletTopup>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: ["pending", "processing", "paid", "failed"], default: "pending", required: true },
    authority: { type: String, required: true, unique: true },
    refId: { type: Number, default: null },
    cardPan: { type: String, default: null },
    description: { type: String, required: true },
    paidAt: { type: Date, default: null },
    failureReason: { type: String, default: null },
    processingToken: { type: String, default: null },
    processingStartedAt: { type: Date, default: null },
    reconciliationNote: { type: String, default: null },
    needsManualReview: { type: Boolean, default: false },
    lastReconcileAt: { type: Date, default: null },
    reconcileAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);
// پشتیبانی از Query آشتی‌سازی (وضعیت + سن). Index جدید هنگام Deploy ساخته می‌شود.
WalletTopupSchema.index({ status: 1, createdAt: 1 });
// چرخش صف Cron: فیلتر وضعیت، مرتب‌سازی بر اساس آخرین بررسی و سن.
WalletTopupSchema.index({ status: 1, lastReconcileAt: 1, createdAt: 1 });
// فهرست رکوردهای نیازمند بررسی دستی (Partial: فقط رکوردهای علامت‌خورده، هزینه ایندکس ناچیز).
WalletTopupSchema.index(
  { needsManualReview: 1, createdAt: -1 },
  { partialFilterExpression: { needsManualReview: true } },
);

type WalletTopupModel = Model<IWalletTopup>;

export const WalletTopup: WalletTopupModel =
  (mongoose.models.WalletTopup as WalletTopupModel) ||
  mongoose.model<IWalletTopup, WalletTopupModel>("WalletTopup", WalletTopupSchema);
