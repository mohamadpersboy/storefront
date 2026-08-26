import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { OrderDetailCard } from "@/components/orders/order-detail-card";
import { connectToDatabase } from "@/lib/db/connect";
import { Order } from "@/models/Order";
import { Payment } from "@/models/Payment";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const order = await Order.findById(id)
    .populate("customer", "fullName phoneNumber")
    .populate("statusHistory.changedBy", "fullName phoneNumber")
    .lean()
    .catch(() => null);

  if (!order) {
    notFound();
  }

  const customer = order.customer as unknown as
    | { fullName?: string; phoneNumber: string }
    | undefined;

  const payments = await Payment.find({ order: order._id })
    .sort({ createdAt: -1 })
    .select("amount status refId createdAt paidAt")
    .lean();

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/orders"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست سفارش‌ها
      </Link>
      <OrderDetailCard
        order={{
          id: String(order._id),
          orderNumber: order.orderNumber,
          customer: customer ?? null,
          items: order.items.map((item) => ({
            title: item.title,
            unit: item.unit,
            colorName: item.colorName,
            attributes: item.attributes,
            unitPrice: item.unitPrice,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
          })),
          shippingAddress: order.shippingAddress,
          subtotal: order.subtotal,
          shippingCost: order.shippingCost,
          discount: order.discount
            ? {
                source: order.discount.source,
                amount: order.discount.amount,
                discountPercentage: order.discount.discountPercentage,
                couponCode: order.discount.couponCode,
                rewardType: order.discount.rewardType,
              }
            : null,
          totalAmount: order.totalAmount,
          paymentMethod: order.paymentMethod,
          prepaymentPercent: order.prepaymentPercent,
          prepaymentAmount: order.prepaymentAmount,
          remainingAmount: order.remainingAmount,
          status: order.status,
          statusHistory: order.statusHistory.map((entry) => ({
            status: entry.status,
            changedAt: entry.changedAt.toISOString(),
            changedByName:
              (entry.changedBy as unknown as { fullName?: string; phoneNumber: string })
                ?.fullName ??
              (entry.changedBy as unknown as { fullName?: string; phoneNumber: string })
                ?.phoneNumber ??
              "—",
            note: entry.note,
          })),
          notes: order.notes,
          createdAt: order.createdAt.toISOString(),
          payments: payments.map((p) => ({
            id: String(p._id),
            amount: p.amount,
            status: p.status,
            refId: p.refId,
            createdAt: p.createdAt.toISOString(),
            paidAt: p.paidAt ? p.paidAt.toISOString() : null,
          })),
        }}
      />
    </div>
  );
}
