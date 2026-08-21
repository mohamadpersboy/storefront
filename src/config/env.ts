import { z } from "zod";

/**
 * Centralized, validated environment variables.
 *
 * Never read `process.env.X` directly elsewhere in the app — import
 * `env` from this file instead. This guarantees required secrets are
 * present at startup instead of failing deep inside a request handler,
 * and keeps every consumer statically typed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // Database
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),

  // Auth
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 chars"),
  OTP_HASH_SECRET: z
    .string()
    .min(32, "OTP_HASH_SECRET must be at least 32 chars"),

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // SMS.ir
  SMS_IR_API_KEY: z.string().min(1),
  SMS_IR_LINE_NUMBER: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:",
      parsed.error.flatten().fieldErrors,
    );
    throw new Error("Invalid environment variables. Check .env against .env.example.");
  }

  return parsed.data;
}

export const env = loadEnv();
