import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db/connect";
import { Product, type IProduct, type IProductVariant } from "@/models/Product";
import { computeFinalPrice, hasDiscount } from "@/lib/utils/pricing";

/**
 * These helpers are the storefront's *only* read path into Product data.
 * They query Mongoose directly (no HTTP round-trip to `/api/v1/products`,
 * which is intentionally Dashboard-only and requires staff auth — see
 * CLAUDE.md §6 Architecture). Every query here is hard-filtered to
 * `status: "published"` so a draft/archived product can never leak to a
 * public visitor, regardless of what a caller passes in.
 */

type LeanProduct = IProduct & {
  _id: Types.ObjectId;
  category: { _id: Types.ObjectId; name: string; slug: string } | Types.ObjectId;
};

export interface StorefrontProductCard {
  id: string;
  title: string;
  slug: string;
  image: { url: string } | null;
  categoryName: string;
  /** Lowest final price across active, in-stock variants (or all variants if none are in stock). */
  startingPrice: number;
  hasAnyDiscount: boolean;
  /** True only if at least one variant is active with stock > 0. */
  inStock: boolean;
}

function pickDisplayVariants(variants: IProductVariant[]) {
  const active = variants.filter((v) => v.isActive);
  const inStock = active.filter((v) => v.stock > 0);
  return inStock.length > 0 ? inStock : active.length > 0 ? active : variants;
}

function toProductCard(p: LeanProduct): StorefrontProductCard {
  const category =
    typeof p.category === "object" && "name" in p.category
      ? p.category
      : { name: "", slug: "" };

  const relevant = pickDisplayVariants(p.variants);
  const finalPrices = relevant.map((v) =>
    computeFinalPrice(v.price, v.discountPercent, v.discountAmount),
  );
  const startingPrice = finalPrices.length > 0 ? Math.min(...finalPrices) : 0;
  const anyDiscount = relevant.some((v) => hasDiscount(v.discountPercent, v.discountAmount));
  const inStock = p.variants.some((v) => v.isActive && v.stock > 0);

  return {
    id: String(p._id),
    title: p.title,
    slug: p.slug,
    image: p.images[0] ? { url: p.images[0].url } : null,
    categoryName: category.name,
    startingPrice,
    hasAnyDiscount: anyDiscount,
    inStock,
  };
}

export interface StorefrontProductsResult {
  products: StorefrontProductCard[];
  page: number;
  totalPages: number;
  totalDocs: number;
}

export async function getStorefrontProducts(options: {
  page?: number;
  limit?: number;
  categorySlug?: string;
  search?: string;
}): Promise<StorefrontProductsResult> {
  await connectToDatabase();
  const { Category } = await import("@/models/Category");

  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(48, Math.max(1, options.limit ?? 12));

  const filter: Record<string, unknown> = { status: "published" };

  if (options.categorySlug) {
    const category = await Category.findOne({
      slug: options.categorySlug,
      isActive: true,
    })
      .select("_id")
      .lean();
    if (!category) {
      return { products: [], page: 1, totalPages: 0, totalDocs: 0 };
    }
    // Include both the category itself and, if it's a top-level category,
    // its direct children — a two-level category (§19) means "پادری" should
    // also show products filed under "پادری > آشپزخانه".
    const children = await Category.find({ parentId: category._id, isActive: true })
      .select("_id")
      .lean();
    const ids = [category._id, ...children.map((c) => c._id)];
    filter.category = { $in: ids };
  }

  if (options.search) {
    const escaped = options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.title = { $regex: escaped, $options: "i" };
  }

  const result = await Product.paginate(filter, {
    page,
    limit,
    sort: { createdAt: -1 },
    populate: { path: "category", select: "name slug" },
    lean: true,
  });

  return {
    products: (result.docs as LeanProduct[]).map(toProductCard),
    page: result.page ?? page,
    totalPages: result.totalPages ?? 0,
    totalDocs: result.totalDocs ?? 0,
  };
}

export async function getFeaturedProducts(limit = 8): Promise<StorefrontProductCard[]> {
  await connectToDatabase();
  const docs = await Product.find({ status: "published" })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate("category", "name slug")
    .lean();
  return (docs as LeanProduct[]).map(toProductCard);
}

export interface StorefrontVariant {
  id: string;
  unit: string;
  color: { name: string; hexCode: string } | null;
  attributes: { name: string; value: string }[];
  price: number;
  finalPrice: number;
  hasDiscount: boolean;
  stock: number;
  isActive: boolean;
  inStock: boolean;
}

export interface StorefrontProductDetail {
  id: string;
  title: string;
  slug: string;
  description?: string;
  technicalDescription?: string;
  technicalSpecifications: { key: string; value: string }[];
  category: { name: string; slug: string };
  images: { url: string }[];
  variants: StorefrontVariant[];
  seo: { title?: string; description?: string };
}

export async function getStorefrontProductBySlug(
  slug: string,
): Promise<StorefrontProductDetail | null> {
  await connectToDatabase();
  const doc = (await Product.findOne({ slug, status: "published" })
    .populate("category", "name slug")
    .lean()) as LeanProduct | null;

  if (!doc) return null;

  const category =
    typeof doc.category === "object" && "name" in doc.category
      ? doc.category
      : { name: "", slug: "" };

  const { Color } = await import("@/models/Color");
  const colorIds = [...new Set(doc.variants.map((v) => v.colorId).filter(Boolean))];
  const colors =
    colorIds.length > 0
      ? await Color.find({ _id: { $in: colorIds } })
          .select("name hexCode")
          .lean()
      : [];
  const colorMap = new Map(colors.map((c) => [String(c._id), c]));

  return {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    description: doc.description,
    technicalDescription: doc.technicalDescription,
    technicalSpecifications: doc.technicalSpecifications,
    category: { name: category.name, slug: category.slug },
    images: doc.images.map((img) => ({ url: img.url })),
    variants: doc.variants.map((v) => ({
      id: String(v._id),
      unit: v.unit,
      color: v.colorId
        ? (() => {
            const c = colorMap.get(String(v.colorId));
            return c ? { name: c.name, hexCode: c.hexCode } : null;
          })()
        : null,
      attributes: v.attributes,
      price: v.price,
      finalPrice: computeFinalPrice(v.price, v.discountPercent, v.discountAmount),
      hasDiscount: hasDiscount(v.discountPercent, v.discountAmount),
      stock: v.stock,
      isActive: v.isActive,
      inStock: v.isActive && v.stock > 0,
    })),
    seo: doc.seo,
  };
}
