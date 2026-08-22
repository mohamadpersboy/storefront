import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";
import { initialMockCategories } from "@/lib/mock/categories";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const category = initialMockCategories.find((c) => c.id === id);

  if (!category) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/categories"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست دسته‌بندی‌ها
      </Link>
      <CategoryForm mode="edit" initial={category} />
    </div>
  );
}
