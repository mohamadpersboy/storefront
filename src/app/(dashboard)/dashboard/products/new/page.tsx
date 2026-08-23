import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";

export default function NewProductPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/products"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست محصولات
      </Link>
      <ProductForm mode="create" />
    </div>
  );
}
