import mongoose, { Schema, type Model, type HydratedDocument, type Types } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import type { PaginateModel } from "mongoose";
import "mongoose-paginate-v2";
import type { OrderStatus } from "@/lib/constants/order-status";
import { ORDER_STATUSES } from "@/lib/constants/order-status";

export type PaymentMethod = "online" | "cash" | "split";

export interface IOrderItem {
  product: Types.ObjectId;
  variantId: Types.ObjectId;
  // Snapshot at order time — product/variant can change or be deleted
  // later without corrupting historical orders.
  title: string;
  unit: string;
  colorName: string | null;
  attributes: Array<{ name: string; value: string }>;
  unitPrice: number; // final price per unit at the time of order (after variant discount)
  quantity: number;
  lineTotal: number; // unitPrice * quantity
}

export interface IShippingAddress {
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
}

export interface IOrderStatusHistoryEntry {
  status: OrderStatus;
  changedAt: Date;
  changedBy: Types.ObjectId;
  note?: string;
}

export interface IOrder {
  orderNumber: number;
  customer: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IShippingAddress;
  subtotal: number; // sum of lineTotals before shipping
  shippingCost: number;
  totalAmount: number; // subtotal + shippingCost
  paymentMethod: PaymentMethod;
  prepaymentPercent: number; // 0-100; 100 for 'online', 0 for 'cash', admin-set for 'split'
  prepaymentAmount: number;
  remainingAmount: number;
  status: OrderStatus;
  statusHistory: IOrderStatusHistoryEntry[];
  notes: string;
  createdAt: Date;
  updatedAt: Date;
}

export type OrderDocument = HydratedDocument<IOrder>;

const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    variantId: { type: Schema.Types.ObjectId, required: true },
    title: { type: String, required: true },
    unit: { type: String, required: true },
    colorName: { type: String, default: null },
    attributes: {
      type: [{ name: String, value: String }],
      default: [],
    },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    recipientName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    addressLine: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistoryEntry>(
  {
    status: { type: String, enum: ORDER_STATUSES, required: true },
    changedAt: { type: Date, required: true, default: Date.now },
    changedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    note: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: Number, required: true, unique: true },
    customer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: {
      type: [OrderItemSchema],
      validate: {
        validator: (v: IOrderItem[]) => v.length >= 1,
        message: "سفارش باید حداقل یک قلم داشته باشد",
      },
    },
    shippingAddress: { type: ShippingAddressSchema, required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["online", "cash", "split"],
      required: true,
    },
    prepaymentPercent: { type: Number, required: true, min: 0, max: 100 },
    prepaymentAmount: { type: Number, required: true, min: 0 },
    remainingAmount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },
    statusHistory: { type: [OrderStatusHistorySchema], default: [] },
    notes: { type: String, trim: true, default: "" },
  },
  { timestamps: true },
);

OrderSchema.plugin(mongoosePaginate);

type OrderModel = Model<IOrder> & PaginateModel<IOrder>;

export const Order: OrderModel =
  (mongoose.models.Order as OrderModel) ||
  mongoose.model<IOrder, OrderModel>("Order", OrderSchema);
