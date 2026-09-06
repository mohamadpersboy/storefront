import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";

/**
 * A card reader (کارتخوان) used to receive POS payments (Master
 * Prompt Phase ۲, بند ۲). References `Bank` — the same reference list
 * already used for Checks — instead of duplicating a free-text bank
 * name. No DELETE: a Payment may reference a terminal that's later
 * deactivated.
 */
export interface IPosTerminal {
  name: string;
  bank: Types.ObjectId;
  accountNumber: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export type PosTerminalDocument = HydratedDocument<IPosTerminal>;

const PosTerminalSchema = new Schema<IPosTerminal>(
  {
    name: { type: String, required: true, trim: true, minlength: 2 },
    bank: { type: Schema.Types.ObjectId, ref: "Bank", required: true, index: true },
    accountNumber: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

type PosTerminalModel = Model<IPosTerminal>;

export const PosTerminal: PosTerminalModel =
  (mongoose.models.PosTerminal as PosTerminalModel) ||
  mongoose.model<IPosTerminal, PosTerminalModel>("PosTerminal", PosTerminalSchema);
