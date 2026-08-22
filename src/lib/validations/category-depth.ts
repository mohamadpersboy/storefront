import { Category } from "@/models/Category";

/**
 * Enforces the max-2-level category depth rule. Call this from
 * create/update route handlers before writing to the database — it's
 * the real source of truth, independent of (and stricter than) the
 * UI-level guard in CategoryForm.
 *
 * @param parentId - the parentId being assigned, or null/undefined for none
 * @param selfId - when updating, the id of the category being edited
 *   (so it can be excluded from the "does it have children" check)
 * @returns an error message string if invalid, or null if valid
 */
export async function validateCategoryParent(
  parentId: string | null | undefined,
  selfId?: string,
): Promise<string | null> {
  if (!parentId) return null;

  if (selfId && parentId === selfId) {
    return "یک دسته‌بندی نمی‌تواند والد خودش باشد";
  }

  const parent = await Category.findById(parentId).select("parentId").lean();
  if (!parent) {
    return "دسته‌بندی والد یافت نشد";
  }

  if (parent.parentId) {
    return "حداکثر عمق مجاز دسته‌بندی ۲ سطح است — دسته والد نمی‌تواند خودش زیردسته باشد";
  }

  if (selfId) {
    const hasChildren = await Category.exists({ parentId: selfId });
    if (hasChildren) {
      return "این دسته‌بندی خودش زیردسته دارد و نمی‌تواند زیرمجموعه دسته دیگری شود";
    }
  }

  return null;
}
