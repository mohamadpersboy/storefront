import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { OrderForm } from "@/components/orders/order-form";

export default function NewOrderPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/orders"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست سفارش‌ها
      </Link>
      <OrderForm />
    </div>
  );
}
