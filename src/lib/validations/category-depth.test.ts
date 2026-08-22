import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateCategoryParent } from "@/lib/validations/category-depth";
import { Category } from "@/models/Category";

vi.mock("@/models/Category", () => ({
  Category: {
    findById: vi.fn(),
    exists: vi.fn(),
  },
}));

function mockFindById(result: unknown) {
  (Category.findById as ReturnType<typeof vi.fn>).mockReturnValue({
    select: () => ({
      lean: () => Promise.resolve(result),
    }),
  });
}

describe("validateCategoryParent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("allows a null/undefined parent (top-level category)", async () => {
    expect(await validateCategoryParent(null)).toBeNull();
    expect(await validateCategoryParent(undefined)).toBeNull();
  });

  it("rejects a category being its own parent", async () => {
    const result = await validateCategoryParent("abc123", "abc123");
    expect(result).toMatch(/والد خودش/);
  });

  it("rejects a non-existent parent", async () => {
    mockFindById(null);
    const result = await validateCategoryParent("missing-id");
    expect(result).toMatch(/یافت نشد/);
  });

  it("allows a top-level category as parent", async () => {
    mockFindById({ parentId: null });
    const result = await validateCategoryParent("top-level-id");
    expect(result).toBeNull();
  });

  it("rejects a parent that is itself a child (would create depth 3)", async () => {
    mockFindById({ parentId: "some-grandparent-id" });
    const result = await validateCategoryParent("child-id");
    expect(result).toMatch(/عمق مجاز/);
  });

  it("rejects assigning a parent to a category that already has children", async () => {
    mockFindById({ parentId: null });
    (Category.exists as ReturnType<typeof vi.fn>).mockResolvedValue(true);
    const result = await validateCategoryParent("top-level-id", "self-id");
    expect(result).toMatch(/خودش زیردسته دارد/);
  });

  it("allows assigning a parent when the category has no children", async () => {
    mockFindById({ parentId: null });
    (Category.exists as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const result = await validateCategoryParent("top-level-id", "self-id");
    expect(result).toBeNull();
  });
});
