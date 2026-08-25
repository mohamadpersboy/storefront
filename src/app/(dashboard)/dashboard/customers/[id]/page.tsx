import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { User } from "@/models/User";
import { Order } from "@/models/Order";
import { CustomerDetailCard } from "@/components/customers/customer-detail-card";

const RECENT_ORDERS_LIMIT = 20;

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const customer = await User.findOne({ _id: id, role: "customer" })
    .lean()
    .catch(() => null);

  if (!customer) {
    notFound();
  }

  const [orders, ordersCount] = await Promise.all([
    Order.find({ customer: id })
      .sort({ createdAt: -1 })
      .limit(RECENT_ORDERS_LIMIT)
      .select("orderNumber status totalAmount createdAt")
      .lean(),
    Order.countDocuments({ customer: id }),
  ]);
  const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/customers"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست مشتریان
      </Link>
      <CustomerDetailCard
        customer={{
          id: String(customer._id),
          fullName: customer.fullName ?? null,
          phoneNumber: customer.phoneNumber,
          isActive: customer.isActive,
          createdAt: customer.createdAt.toISOString(),
          lastLoginAt: customer.lastLoginAt ? customer.lastLoginAt.toISOString() : null,
          ordersCount,
          totalSpent,
          partialTotalSpent: ordersCount > orders.length,
          orders: orders.map((o) => ({
            id: String(o._id),
            orderNumber: o.orderNumber,
            status: o.status,
            totalAmount: o.totalAmount,
            createdAt: o.createdAt.toISOString(),
          })),
        }}
      />
    </div>
  );
}
