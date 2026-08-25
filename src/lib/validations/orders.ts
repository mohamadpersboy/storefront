import { z } from "zod";
import { ORDER_STATUSES } from "@/lib/constants/order-status";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const phoneNumberRegex = /^09\d{9}$/;

export const findOrCreateCustomerSchema = z.object({
  phoneNumber: z.string().trim().regex(phoneNumberRegex, "شماره موبایل معتبر نیست"),
  fullName: z.string().trim().optional(),
});

const orderItemInputSchema = z.object({
  productId: z.string().regex(objectIdRegex, "محصول معتبر نیست"),
  variantId: z.string().regex(objectIdRegex, "Variant معتبر نیست"),
  quantity: z.number().int().min(1, "تعداد باید حداقل ۱ باشد"),
});

const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(2, "نام گیرنده الزامی است"),
  phoneNumber: z.string().trim().regex(phoneNumberRegex, "شماره موبایل معتبر نیست"),
  province: z.string().trim().min(2, "استان الزامی است"),
  city: z.string().trim().min(2, "شهر الزامی است"),
  addressLine: z.string().trim().min(5, "آدرس کامل الزامی است"),
  postalCode: z.string().trim().min(5, "کد پستی معتبر نیست"),
});

export const createOrderSchema = z.object({
  customerId: z.string().regex(objectIdRegex, "مشتری معتبر نیست"),
  items: z.array(orderItemInputSchema).min(1, "سفارش باید حداقل یک قلم داشته باشد"),
  shippingAddress: shippingAddressSchema,
  shippingCost: z.number().min(0).default(0),
  paymentMethod: z.enum(["online", "cash", "split"]),
  prepaymentPercent: z.number().min(0).max(100).optional(),
  notes: z.string().trim().optional().default(""),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(ORDER_STATUSES as [string, ...string[]]),
  note: z.string().trim().max(500).optional(),
});

export const ordersListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  search: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES as [string, ...string[]]).optional(),
});
