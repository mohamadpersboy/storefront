/**
 * ⚠️ MOCK DATA — فقط برای مرحله Dashboard UI.
 *
 * این داده‌ها ساختگی هستند و نباید به‌عنوان Backend واقعی تلقی شوند.
 * در فاز Dashboard Backend، این فایل حذف و با فراخوانی واقعی API
 * جایگزین می‌شود (طبق CLAUDE.md بخش «No Fake Data Rule»).
 */

export const mockKpis = {
  todaySales: 48_500_000,
  monthSales: 612_000_000,
  ordersCount: 214,
  pendingOrders: 12,
  customersCount: 1_038,
  productsCount: 156,
  outOfStockProducts: 7,
  lowStockProducts: 15,
  activeDiscounts: 9,
  activeAmazingOffers: 3,
};

export const mockSalesTrend = [
  { label: "شنبه", value: 32_000_000 },
  { label: "یکشنبه", value: 41_000_000 },
  { label: "دوشنبه", value: 28_000_000 },
  { label: "سه‌شنبه", value: 55_000_000 },
  { label: "چهارشنبه", value: 47_000_000 },
  { label: "پنجشنبه", value: 63_000_000 },
  { label: "جمعه", value: 48_500_000 },
];

export const mockOrderStatusDistribution = [
  { status: "در انتظار بررسی", value: 12, tone: "warning" as const },
  { status: "در حال پردازش", value: 28, tone: "primary" as const },
  { status: "ارسال‌شده", value: 41, tone: "neutral" as const },
  { status: "تحویل‌شده", value: 118, tone: "success" as const },
  { status: "مرجوعی", value: 6, tone: "danger" as const },
];

export const mockTopProducts = [
  { id: "1", title: "فرش ماشینی طرح باستان ۱۲۰۰ شانه", sold: 84, revenue: 340_000_000 },
  { id: "2", title: "پادری آشپزخانه طرح گلیم", sold: 61, revenue: 42_500_000 },
  { id: "3", title: "تابلو فرش طرح درخت زندگی", sold: 39, revenue: 210_000_000 },
  { id: "4", title: "موکت طرح‌دار کف اداری", sold: 33, revenue: 96_000_000 },
  { id: "5", title: "روفرشی مخمل کوتاه‌خواب", sold: 27, revenue: 58_500_000 },
];

export type MockOrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export const mockRecentOrders: Array<{
  id: string;
  customerName: string;
  itemsCount: number;
  total: number;
  status: MockOrderStatus;
  createdAt: string;
}> = [
  { id: "10231", customerName: "علی محمدی", itemsCount: 2, total: 18_400_000, status: "pending", createdAt: "۱۴۰۴/۰۵/۳۰" },
  { id: "10230", customerName: "زهرا احمدی", itemsCount: 1, total: 6_200_000, status: "processing", createdAt: "۱۴۰۴/۰۵/۳۰" },
  { id: "10229", customerName: "حسین رضایی", itemsCount: 4, total: 52_000_000, status: "confirmed", createdAt: "۱۴۰۴/۰۵/۲۹" },
  { id: "10228", customerName: "مریم کریمی", itemsCount: 1, total: 3_100_000, status: "shipped", createdAt: "۱۴۰۴/۰۵/۲۹" },
  { id: "10227", customerName: "امیر حسینی", itemsCount: 3, total: 27_800_000, status: "delivered", createdAt: "۱۴۰۴/۰۵/۲۸" },
  { id: "10226", customerName: "فاطمه نوری", itemsCount: 1, total: 4_500_000, status: "cancelled", createdAt: "۱۴۰۴/۰۵/۲۸" },
];
