/**
 * ⚠️ MOCK DATA — فقط برای مرحله users/ui.
 * در فاز users/backend با نتیجه واقعی API (با mongoose-paginate-v2)
 * جایگزین می‌شود. طبق CLAUDE.md «No Fake Data Rule».
 */
import type { Role } from "@/lib/constants/rbac";

export interface MockUser {
  id: string;
  fullName: string | null;
  phoneNumber: string;
  role: Role;
  isActive: boolean;
  ordersCount: number;
  createdAt: string;
  lastLoginAt: string | null;
}

const names = [
  "علی محمدی", "زهرا احمدی", "حسین رضایی", "مریم کریمی", "امیر حسینی",
  "فاطمه نوری", "رضا صادقی", "سارا مرادی", "محمد قاسمی", "نگار امینی",
  null, "کیانا رستمی", "پویا نجفی", null, "الهام یوسفی",
  "بهزاد کاظمی", "شیرین طاهری", null, "آرش فرهادی", "لیلا شریفی",
  "کامران عزیزی", "پریسا حیدری", null, "سینا جعفری",
];

const roles: Role[] = ["customer", "customer", "customer", "staff", "admin"];

export const mockUsers: MockUser[] = names.map((fullName, i) => ({
  id: String(1000 + i),
  fullName,
  phoneNumber: `0912${String(1000000 + i * 137).slice(0, 7)}`,
  role: i === 0 ? "super_admin" : roles[i % roles.length],
  isActive: i % 7 !== 3,
  ordersCount: (i * 3 + 1) % 13,
  createdAt: `۱۴۰۴/${String(1 + (i % 6)).padStart(2, "0")}/${String(1 + (i % 28)).padStart(2, "0")}`,
  lastLoginAt: i % 5 === 0 ? null : `۱۴۰۴/۰۵/${String(1 + (i % 28)).padStart(2, "0")}`,
}));
