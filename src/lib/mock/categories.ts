/**
 * ⚠️ MOCK DATA — فقط برای مرحله categories/ui.
 * در فاز categories/backend با مدل و API واقعی جایگزین می‌شود.
 * طبق CLAUDE.md «No Fake Data Rule».
 */

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  isActive: boolean;
  productsCount: number;
}

export const initialMockCategories: MockCategory[] = [
  { id: "c1", name: "فرش ماشینی", slug: "farsh-mashini", parentId: null, isActive: true, productsCount: 42 },
  { id: "c1-1", name: "۱۲۰۰ شانه", slug: "1200-shane", parentId: "c1", isActive: true, productsCount: 18 },
  { id: "c1-2", name: "۱۵۰۰ شانه", slug: "1500-shane", parentId: "c1", isActive: true, productsCount: 14 },
  { id: "c1-3", name: "۷۰۰ شانه", slug: "700-shane", parentId: "c1", isActive: true, productsCount: 10 },

  { id: "c2", name: "موکت", slug: "mooket", parentId: null, isActive: true, productsCount: 15 },

  { id: "c3", name: "کناره", slug: "kenareh", parentId: null, isActive: true, productsCount: 9 },

  { id: "c4", name: "پشتی", slug: "poshti", parentId: null, isActive: true, productsCount: 6 },

  { id: "c5", name: "تابلو فرش", slug: "tablo-farsh", parentId: null, isActive: true, productsCount: 11 },

  { id: "c6", name: "روفرشی", slug: "roo-farshi", parentId: null, isActive: true, productsCount: 7 },

  { id: "c7", name: "پادری", slug: "padari", parentId: null, isActive: true, productsCount: 20 },
  { id: "c7-1", name: "آشپزخانه", slug: "ashpazkhane", parentId: "c7", isActive: true, productsCount: 12 },
  { id: "c7-2", name: "حمام", slug: "hamam", parentId: "c7", isActive: false, productsCount: 8 },

  { id: "c8", name: "قالیچه", slug: "ghalicheh", parentId: null, isActive: true, productsCount: 5 },
];
