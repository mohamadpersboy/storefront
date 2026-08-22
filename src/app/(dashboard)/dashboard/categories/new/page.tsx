import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";

export default function NewCategoryPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/categories"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست دسته‌بندی‌ها
      </Link>
      <CategoryForm mode="create" />
    </div>
  );
}
