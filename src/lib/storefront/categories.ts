import { connectToDatabase } from "@/lib/db/connect";
import { Category } from "@/models/Category";

export interface StorefrontCategoryNode {
  id: string;
  name: string;
  slug: string;
  children: { id: string; name: string; slug: string }[];
}

/**
 * Two-level active category tree (Master Prompt §19). Used for both the
 * site header dropdown/mobile menu and the Home page category tiles.
 */
export async function getStorefrontCategoryTree(): Promise<StorefrontCategoryNode[]> {
  await connectToDatabase();
  const all = await Category.find({ isActive: true })
    .sort({ sortOrder: 1, name: 1 })
    .lean();

  const topLevel = all.filter((c) => c.parentId === null);
  return topLevel.map((parent) => ({
    id: String(parent._id),
    name: parent.name,
    slug: parent.slug,
    children: all
      .filter((c) => c.parentId?.toString() === String(parent._id))
      .map((child) => ({ id: String(child._id), name: child.name, slug: child.slug })),
  }));
}

export async function getStorefrontCategoryBySlug(slug: string) {
  await connectToDatabase();
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return null;
  return {
    id: String(category._id),
    name: category.name,
    slug: category.slug,
    parentId: category.parentId ? String(category.parentId) : null,
  };
}
