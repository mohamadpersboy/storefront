import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

export interface IFaq {
  question: string;
  answer: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type FaqDocument = HydratedDocument<IFaq>;

const FaqSchema = new Schema<IFaq>(
  {
    question: { type: String, required: true, trim: true, minlength: 3 },
    answer: { type: String, required: true, trim: true, minlength: 3 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type FaqModel = Model<IFaq>;

export const Faq: FaqModel =
  (mongoose.models.Faq as FaqModel) ||
  mongoose.model<IFaq, FaqModel>("Faq", FaqSchema);
