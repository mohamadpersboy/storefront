import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { ProductForm } from "@/components/products/product-form";
import { connectToDatabase } from "@/lib/db/connect";
import { Product } from "@/models/Product";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await connectToDatabase();
  const product = await Product.findById(id).lean().catch(() => null);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/products"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به لیست محصولات
      </Link>
      <ProductForm
        mode="edit"
        initial={{
          id: String(product._id),
          title: product.title,
          slug: product.slug,
          description: product.description ?? "",
          technicalDescription: product.technicalDescription ?? "",
          technicalSpecifications: product.technicalSpecifications,
          category: String(product.category),
          images: product.images,
          variants: product.variants.map((v) => ({
            id: String(v._id),
            unit: v.unit,
            attributes: v.attributes,
            sku: v.sku ?? "",
            price: v.price,
            discountPercent: v.discountPercent,
            discountAmount: v.discountAmount,
            stock: v.stock,
            isActive: v.isActive,
          })),
          status: product.status,
          seo: product.seo ?? {},
        }}
      />
    </div>
  );
}
