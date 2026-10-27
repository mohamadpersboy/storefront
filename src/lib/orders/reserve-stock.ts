import type { Types } from "mongoose";
import { Product } from "@/models/Product";

export class StockReservationError extends Error {}

export interface StockLine {
  product: Types.ObjectId | string;
  variantId: Types.ObjectId | string;
  title: string;
  quantity: number;
}

/**
 * کسر اتمیک موجودی هر Variant. شرط `stock >= quantity` داخل «همان»
 * Query است (نه یک چک جدا)؛ پس هم‌زمانی هرگز موجودی را منفی نمی‌کند.
 * اگر یک خط شکست بخورد، خطوط قبلی همین فراخوانی برگردانده می‌شوند
 * (همه یا هیچ از دید سفارش).
 */
export async function reserveStock(lines: StockLine[]): Promise<void> {
  const reserved: StockLine[] = [];
  for (const line of lines) {
    const result = await Product.updateOne(
      {
        _id: line.product,
        variants: {
          $elemMatch: { _id: line.variantId, isActive: true, stock: { $gte: line.quantity } },
        },
      },
      { $inc: { "variants.$.stock": -line.quantity } },
    );
    if (result.modifiedCount !== 1) {
      await releaseStock(reserved);
      throw new StockReservationError(
        `موجودی «${line.title}» کافی نیست یا هم‌زمان تغییر کرد`,
      );
    }
    reserved.push(line);
  }
}

/** برگرداندن موجودی کسرشده (جبران شکست سفارش). خطا بقیه را متوقف نمی‌کند. */
export async function releaseStock(lines: StockLine[]): Promise<void> {
  for (const line of lines) {
    try {
      await Product.updateOne(
        { _id: line.product, "variants._id": line.variantId },
        { $inc: { "variants.$.stock": line.quantity } },
      );
    } catch (error) {
      console.error("Failed to release stock", String(line.product), error instanceof Error ? error.message : error);
    }
  }
}
