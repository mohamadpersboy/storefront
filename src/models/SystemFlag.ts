import mongoose, { Schema, type Model } from "mongoose";

/**
 * Generic key/value system flags. Currently used for exactly one thing:
 * atomically deciding which concurrent OTP-verify request "wins" the
 * right to become the first Super Admin.
 *
 * Why this pattern instead of `User.countDocuments() === 0`:
 * count() + insert is two separate operations, so two simultaneous
 * first-time verifications could both read count===0 and both become
 * Super Admin. A single findOneAndUpdate on one document is atomic in
 * MongoDB, so only one caller can ever "claim" the flag.
 */
export interface ISystemFlag {
  key: string;
  value: boolean;
}

const SystemFlagSchema = new Schema<ISystemFlag>({
  key: { type: String, required: true, unique: true },
  value: { type: Boolean, required: true, default: false },
});

type SystemFlagModel = Model<ISystemFlag>;

export const SystemFlag: SystemFlagModel =
  (mongoose.models.SystemFlag as SystemFlagModel) ||
  mongoose.model<ISystemFlag, SystemFlagModel>("SystemFlag", SystemFlagSchema);

export const FIRST_ADMIN_ASSIGNED_KEY = "firstAdminAssigned";

/**
 * Atomically checks-and-claims the "first admin" slot.
 * Returns true only for the single caller that wins the race — that
 * caller (and only that caller) should create the new user as
 * super_admin. Every other caller gets false and should use the
 * normal default role (customer).
 *
 * Implementation note: we rely on the unique index on `key` rather than
 * a findOneAndUpdate($ne) + upsert combo. A plain insert is atomic —
 * the first caller's insert succeeds, every later caller's insert hits
 * a duplicate-key error (E11000) and is treated as "lost the race".
 */
export async function claimFirstAdminSlot(): Promise<boolean> {
  try {
    await SystemFlag.create({ key: FIRST_ADMIN_ASSIGNED_KEY, value: true });
    return true;
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: number }).code === 11000
    ) {
      return false;
    }
    throw error;
  }
}
