import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";

/**
 * Recomputes `Order.paidAmount`/`Order.remainingAmount` from the
 * actual, currently-active `Payment` records attached to it (Master
 * Prompt — Financial Management, Phase ۲، بند ۴ و ۱۰). Only `status:
 * "paid"` payments count as money actually received — a `"returned"`
 * payment (its linked Check was returned) stops counting immediately,
 * without ever deleting the Payment/Check record itself (بند ۱۱).
 *
 * Called after every manual payment mutation (create / a linked
 * check's return). Deliberately NOT wired into the existing
 * Zarinpal `payments/callback` route — the project's documented
 * decision is that a successful online payment never auto-mutates
 * Order fields (see CLAUDE.md, بخش Payment); this function only
 * governs the new manual-payment subsystem.
 */
export async function recalculateOrderPaymentTotals(orderId: string): Promise<void> {
  const order = await Order.findById(orderId);
  if (!order) return;

  const payments = await Payment.find({ order: orderId, status: "paid" })
    .select("amount walletAmount")
    .lean();

  const paidAmount = payments.reduce((sum, p) => sum + p.amount + (p.walletAmount ?? 0), 0);

  order.paidAmount = paidAmount;
  order.remainingAmount = Math.max(order.totalAmount - paidAmount, 0);
  await order.save();
}
