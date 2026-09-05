import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";
import { CHECK_STATUSES, type CheckStatus } from "@/lib/constants/check-status";

export interface ICheckPerson {
  firstName: string;
  lastName: string;
  nationalId: string;
}

/** Guarantor is optional as a whole, and — unlike issuer — its national ID is optional too. */
export interface ICheckGuarantor {
  firstName: string;
  lastName: string;
  nationalId?: string;
}

export interface ICheckTransferTarget {
  firstName?: string;
  lastName?: string;
  nationalId?: string;
}

export interface ICheckReturnInfo {
  returnedAt: Date;
  returnedToName: string;
  returnedToNationalId: string | null;
  reason: string;
}

/**
 * A check received from a customer (چک دریافتی). This is a real
 * financial record — Master Prompt بند ۱۱ forbids ever deleting it;
 * state changes (return/transfer/collection) are recorded as status
 * transitions + append-only history in `ActivityLog`, never as a
 * destructive edit or a Mongo `deleteOne`. No API in this project
 * exposes a DELETE for Check on purpose.
 *
 * Connection to `Order`/`Payment` (Master Prompt بند ۹) is
 * intentionally NOT modeled here as a direct field — that link is
 * owned by `Payment` (Phase 2: a Payment of type "check" references
 * a Check), keeping Check itself a standalone, reusable financial
 * entity rather than something that assumes it's always order-bound.
 */
export interface ICheck {
  bank: Types.ObjectId;
  issuer: ICheckPerson;
  receiver: Types.ObjectId; // ref User — an admin/staff member, per Master Prompt بند ۲
  guarantor: ICheckGuarantor | null;
  phoneNumber: string;
  receivedDate: Date;
  dueDate: Date;
  amount: number; // Tomans, stored as Number — display formatting happens in the UI layer only
  checkSeries: string; // سری چک — up to 6 digits
  checkNumber: string; // شناسه چک — up to 6 digits
  sayadiId: string; // شناسه صیادی — 16-digit Sayadi identifier
  status: CheckStatus;
  transferredTo: ICheckTransferTarget | null;
  returnInfo: ICheckReturnInfo | null;
  createdBy: Types.ObjectId; // ref User — who registered the check in the system
  createdAt: Date;
  updatedAt: Date;
}

export type CheckDocument = HydratedDocument<ICheck>;

const CheckPersonSchema = new Schema<ICheckPerson>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    nationalId: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const CheckGuarantorSchema = new Schema<ICheckGuarantor>(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    nationalId: { type: String, trim: true },
  },
  { _id: false },
);

const CheckTransferTargetSchema = new Schema<ICheckTransferTarget>(
  {
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    nationalId: { type: String, trim: true },
  },
  { _id: false },
);

const CheckReturnInfoSchema = new Schema<ICheckReturnInfo>(
  {
    returnedAt: { type: Date, required: true },
    returnedToName: { type: String, required: true, trim: true },
    returnedToNationalId: { type: String, default: null },
    reason: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const CheckSchema = new Schema<ICheck>(
  {
    bank: { type: Schema.Types.ObjectId, ref: "Bank", required: true, index: true },
    issuer: { type: CheckPersonSchema, required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    guarantor: { type: CheckGuarantorSchema, default: null },
    phoneNumber: { type: String, required: true, trim: true },
    receivedDate: { type: Date, required: true },
    dueDate: { type: Date, required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    checkSeries: { type: String, required: true, trim: true },
    checkNumber: { type: String, required: true, trim: true },
    sayadiId: { type: String, required: true, trim: true, index: true },
    status: {
      type: String,
      enum: CHECK_STATUSES,
      default: "registered",
      required: true,
      index: true,
    },
    transferredTo: { type: CheckTransferTargetSchema, default: null },
    returnInfo: { type: CheckReturnInfoSchema, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

CheckSchema.plugin(mongoosePaginate);

type CheckModel = Model<ICheck> & PaginateModel<ICheck>;

export const Check: CheckModel =
  (mongoose.models.Check as CheckModel) ||
  mongoose.model<ICheck, CheckModel>("Check", CheckSchema);
