import { notFound } from "next/navigation";
import Link from "next/link";
import { getStorefrontProductBySlug } from "@/lib/storefront/products";
import { ProductGallery } from "@/components/storefront/product-gallery";
import { ProductVariantSelector } from "@/components/storefront/product-variant-selector";

// Always live — see (storefront)/page.tsx for rationale.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) return { title: "محصول یافت نشد" };
  return {
    title: product.seo.title || product.title,
    description: product.seo.description || product.description,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getStorefrontProductBySlug(slug);
  if (!product) notFound();

  return (
    <div>
      <nav className="mb-4 text-xs text-muted">
        <Link href="/" className="hover:text-primary">
          خانه
        </Link>
        <span className="mx-1.5">/</span>
        <Link href={`/category/${product.category.slug}`} className="hover:text-primary">
          {product.category.name}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{product.title}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div>
          <h1 className="text-lg font-semibold text-foreground sm:text-xl">
            {product.title}
          </h1>
          {product.description ? (
            <p className="mt-2 text-sm leading-6 text-muted">{product.description}</p>
          ) : null}

          <div className="mt-4">
            <ProductVariantSelector variants={product.variants} />
          </div>
        </div>
      </div>

      {product.technicalSpecifications.length > 0 || product.technicalDescription ? (
        <section className="mt-10 rounded-[var(--radius-lg)] border border-border">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold text-foreground">مشخصات فنی</h2>
          </div>
          <div className="p-5">
            {product.technicalDescription ? (
              <p className="mb-4 text-sm leading-6 text-muted">
                {product.technicalDescription}
              </p>
            ) : null}
            {product.technicalSpecifications.length > 0 ? (
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {product.technicalSpecifications.map((spec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between border-b border-border py-2 text-sm sm:justify-start sm:gap-3"
                  >
                    <dt className="text-muted">{spec.key}</dt>
                    <dd className="font-medium text-foreground">{spec.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
