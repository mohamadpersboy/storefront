import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/**
 * Reference list of banks, managed from Settings (Master Prompt —
 * Financial Management, بند ۱). Kept independent from `Check` so the
 * same bank record can later be reused by store bank accounts/card
 * readers (Phase 2) without duplication.
 */
export interface IBank {
  name: string;
  logoUrl: string | null;
  logoPublicId: string | null; // Cloudinary public_id — needed to replace/delete the logo later
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type BankDocument = HydratedDocument<IBank>;

const BankSchema = new Schema<IBank>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, unique: true },
    logoUrl: { type: String, default: null },
    logoPublicId: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type BankModel = Model<IBank>;

export const Bank: BankModel =
  (mongoose.models.Bank as BankModel) || mongoose.model<IBank, BankModel>("Bank", BankSchema);
