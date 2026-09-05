import { z } from "zod";
import { isValidIranianNationalId } from "@/lib/utils/national-id";
import { ACTIVE_PHASE1_STATUSES, CHECK_STATUSES, type CheckStatus } from "@/lib/constants/check-status";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const phoneNumberRegex = /^09\d{9}$/;
const sixDigitsRegex = /^\d{1,6}$/;
const sayadiIdRegex = /^\d{16}$/; // Sayadi ID (شناسه صیادی) is a 16-digit code

const nationalIdField = z
  .string()
  .trim()
  .refine(isValidIranianNationalId, "کد ملی معتبر نیست");

const personSchema = z.object({
  firstName: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(60),
  lastName: z.string().trim().min(2, "نام خانوادگی باید حداقل ۲ حرف باشد").max(60),
  nationalId: nationalIdField,
});

const guarantorSchema = z.object({
  firstName: z.string().trim().min(2, "نام ضامن باید حداقل ۲ حرف باشد").max(60),
  lastName: z.string().trim().min(2, "نام خانوادگی ضامن باید حداقل ۲ حرف باشد").max(60),
  nationalId: nationalIdField.optional(),
});

export const createCheckSchema = z
  .object({
    bankId: z.string().regex(objectIdRegex, "بانک معتبر نیست"),
    issuer: personSchema,
    receiverId: z.string().regex(objectIdRegex, "دریافت‌کننده معتبر نیست"),
    guarantor: guarantorSchema.nullable().optional(),
    phoneNumber: z.string().trim().regex(phoneNumberRegex, "شماره موبایل معتبر نیست"),
    receivedDate: z.coerce.date(),
    dueDate: z.coerce.date(),
    amount: z.number().int("مبلغ باید عدد صحیح باشد").positive("مبلغ باید بزرگ‌تر از صفر باشد"),
    checkSeries: z.string().trim().regex(sixDigitsRegex, "سری چک باید حداکثر ۶ رقم باشد"),
    checkNumber: z.string().trim().regex(sixDigitsRegex, "شناسه چک باید حداکثر ۶ رقم باشد"),
    sayadiId: z.string().trim().regex(sayadiIdRegex, "شناسه صیادی باید ۱۶ رقم باشد"),
    status: z.enum(ACTIVE_PHASE1_STATUSES as [CheckStatus, ...CheckStatus[]]).default("registered"),
  })
  .refine((data) => data.dueDate >= data.receivedDate, {
    message: "تاریخ سررسید نمی‌تواند قبل از تاریخ دریافت باشد",
    path: ["dueDate"],
  });

export const updateCheckSchema = z.object({
  bankId: z.string().regex(objectIdRegex, "بانک معتبر نیست").optional(),
  issuer: personSchema.optional(),
  receiverId: z.string().regex(objectIdRegex, "دریافت‌کننده معتبر نیست").optional(),
  guarantor: guarantorSchema.nullable().optional(),
  phoneNumber: z.string().trim().regex(phoneNumberRegex, "شماره موبایل معتبر نیست").optional(),
  receivedDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  amount: z
    .number()
    .int("مبلغ باید عدد صحیح باشد")
    .positive("مبلغ باید بزرگ‌تر از صفر باشد")
    .optional(),
  checkSeries: z
    .string()
    .trim()
    .regex(sixDigitsRegex, "سری چک باید حداکثر ۶ رقم باشد")
    .optional(),
  checkNumber: z
    .string()
    .trim()
    .regex(sixDigitsRegex, "شناسه چک باید حداکثر ۶ رقم باشد")
    .optional(),
  sayadiId: z.string().trim().regex(sayadiIdRegex, "شناسه صیادی باید ۱۶ رقم باشد").optional(),
});

export const returnCheckSchema = z.object({
  returnedAt: z.coerce.date(),
  returnedToName: z.string().trim().min(2, "نام گیرنده باید حداقل ۲ حرف باشد").max(120),
  returnedToNationalId: nationalIdField.nullable().optional(),
  reason: z.string().trim().min(3, "دلیل عودت باید حداقل ۳ حرف باشد").max(500),
});

export const transferCheckSchema = z.object({
  firstName: z.string().trim().min(2, "نام باید حداقل ۲ حرف باشد").max(60),
  lastName: z.string().trim().min(2, "نام خانوادگی باید حداقل ۲ حرف باشد").max(60),
  nationalId: nationalIdField.optional(),
});

export const checksListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  status: z.enum(CHECK_STATUSES as [CheckStatus, ...CheckStatus[]]).optional(),
  bankId: z.string().regex(objectIdRegex).optional(),
});
