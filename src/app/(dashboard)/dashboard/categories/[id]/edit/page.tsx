import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";
import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const category = await Category.findById(id).lean().catch(() => null);

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
      <CategoryForm
        mode="edit"
        initial={{
          id: String(category._id),
          name: category.name,
          slug: category.slug,
          parentId: category.parentId ? String(category.parentId) : null,
          isActive: category.isActive,
          sortOrder: category.sortOrder,
          imageUrl: category.imageUrl,
          imageBlurDataUrl: category.imageBlurDataUrl,
          showOnHomepage: category.showOnHomepage,
        }}
      />
    </div>
  );
}
