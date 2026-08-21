import mongoose, { Schema, type Model, type HydratedDocument } from "mongoose";

/**
 * OTP codes are never stored in plaintext — only their HMAC hash
 * (see `src/lib/auth/otp.ts`). Documents expire automatically via the
 * TTL index on `expiresAt` so stale codes don't accumulate.
 */
export interface IOtp {
  phoneNumber: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number; // failed verification attempts, for brute-force lockout
  consumedAt?: Date | null;
  requestedIp?: string;
  createdAt: Date;
}

export type OtpDocument = HydratedDocument<IOtp>;

const OtpSchema = new Schema<IOtp>(
  {
    phoneNumber: { type: String, required: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    requestedIp: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL index: MongoDB automatically deletes the document once expiresAt passes.
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

type OtpModel = Model<IOtp>;

export const Otp: OtpModel =
  (mongoose.models.Otp as OtpModel) || mongoose.model<IOtp, OtpModel>("Otp", OtpSchema);
