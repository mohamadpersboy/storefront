@AGENTS.md

# CLAUDE.md — کارت‌من (فروشگاه اینترنتی تخصصی فرش)

> این فایل مرجع اصلی پروژه است. اگر Chat جدید باز شد یا Context قبلی
> از دست رفت، فقط با خواندن این فایل و `README.md` باید بتوانی ادامه
> بدهی. هر تصمیم معماری مهم باید همین‌جا ثبت شود، نه فقط در چت.

---

## 1. Project Overview

فروشگاه اینترنتی تخصصی محصولات فرش برای بازار ایران (RTL، فارسی).
یک پلتفرم کامل شامل Storefront + Dashboard مدیریتی با مدیریت محصول/
Variant/موجودی/سفارش/پرداخت/تخفیف.

Full specification در پرامپت اصلی کاربر (Master Prompt) آمده و همه
تصمیمات باید با آن سازگار باشند. خلاصه قوانین کلیدی:

- توسعه **مرحله‌ای** است: Dashboard UI → تأیید → Dashboard Backend →
  Integration → تست → Merge. **Storefront بعد از تکمیل کامل و تأیید
  Dashboard شروع می‌شود.**
- هیچ Feature‌ای بدون تأیید صریح کاربر روی `main` Merge نمی‌شود.
- Mock Data در UI مجاز است ولی باید واضحاً مشخص باشد و هرگز به‌جای
  Backend واقعی معرفی نشود.

## 2. Current Status

**مرحله:** Initial Project Setup — تکمیل شد
**Branch فعلی:** `main`
**Feature بعدی:** Dashboard UI (`dashboard/ui` branch) — شروع نشده،
منتظر تأیید کاربر برای شروع.

## 3. Completed

- Bootstrap پروژه Next.js 16.3 (App Router, TypeScript, Turbopack)
- Tailwind CSS v4 با Design Tokens سفارشی (بخش ۱۰)
- فونت IRANYekanX Pro (چهار وزن: Regular/Medium/DemiBold/Bold) از طریق
  next/font/local
- ساختار پوشه‌ای ماژولار (بخش ۸)
- لایه Environment Variables با اعتبارسنجی Zod (src/config/env.ts)
- اتصال Mongoose Singleton (src/lib/db/connect.ts)
- ساختار پاسخ یکپارچه API (src/lib/utils/api-response.ts)
- معماری اولیه Authentication:
  - مدل User (Soft Delete، Role، Pagination Plugin)
  - مدل Otp (Hash-only، TTL Index برای Expiry خودکار)
  - Utility هش OTP (HMAC-SHA256، جدا از AUTH_SECRET)
  - Session Token با jose (Edge-safe، برای استفاده در proxy.ts)
  - RBAC کامل: نقش‌ها + Permission Catalog قابل توسعه
  - src/proxy.ts — Optimistic Route Protection برای /dashboard/*
    (این تنها لایه Authorization نیست — هر Route باید خودش هم Session
    و Permission را دوباره بررسی کند)
- .env.example کامل
- Lint / Typecheck / Build — همه سبز

## 4. In Progress

هیچ Feature‌ای در حال توسعه نیست — منتظر شروع Dashboard UI.

## 5. Planned (به ترتیب اولویت طبق Master Prompt)

1. Dashboard UI (Layout, Sidebar, KPI Cards, Charts placeholder, Tables,
   Loading/Empty/Error states) — با Mock Data
2. تأیید کاربر روی UI
3. Dashboard Backend (Auth API واقعی، OTP request/verify، Aggregation
   برای KPI/Charts)
4. Integration + حذف Mock Data
5. Testing
6. Merge به main
7. سپس: Users → Products → Categories → Orders → Discounts →
   Amazing Offers → ... (هر کدام UI → Backend → Integration → Test →
   Approval)
8. بعد از تکمیل کامل Dashboard: شروع Storefront

## 6. Architecture

**نوع:** Next.js App Router، Full-stack یکپارچه (بدون Backend جدا).
API Routes زیر src/app/api/v1/... قرار می‌گیرند (Versioned).

**لایه‌بندی:**
```
app/            - Routes (UI + API) - نازک، فقط orchestration
lib/            - Business logic, DB, auth, utils
models/         - Mongoose Schemas
components/     - UI components (ui = primitives, dashboard/storefront = feature-specific)
config/         - env, app-wide constants
types/          - Shared TypeScript types
fonts/          - next/font/local loaders
```

**Auth Flow:** Mobile Number + OTP → Session Cookie (JWT با jose،
HttpOnly، Secure در Production). اولین کاربر تأییدشده = Super Admin.
این منطق باید Race-Condition-Safe پیاده‌سازی شود (نه ساده count()===0)
— با یک Atomic findOneAndUpdate/Unique Index موقع تعیین اولین ادمین.

**API Response Format (ثابت در کل پروژه):**
```
موفق: { success: true, data: T, message?: string, pagination?: {...} }
خطا:  { success: false, message: string, errors?: Record<string, string[]> }
```
هلپرهای apiSuccess/apiError در src/lib/utils/api-response.ts.

## 7. Tech Stack (نسخه‌ها در زمان Bootstrap - Aug 2026)

| Package | Version | یادداشت |
|---|---|---|
| next | 16.3.1 | App Router, Turbopack, proxy.ts (نام جدید middleware از v16) |
| react / react-dom | 19.2.8 | |
| typescript | ^5 | |
| tailwindcss | ^4 | CSS-first config (@theme inline در globals.css) |
| mongoose | 9.9.3 | |
| mongoose-paginate-v2 | 1.9.5 | Pagination برای لیست‌های Dashboard |
| cloudinary | 2.10.1 | نصب شده، هنوز Wire نشده (Feature بعدی) |
| zod | 4.4.3 | Validation (Client + Server) |
| jose | 6.2.9 | JWT - Edge-runtime-safe (برای proxy.ts) |
| lucide-react | 1.33.0 | آیکون |
| clsx + tailwind-merge | - | ترکیب کلاس‌های Tailwind |
| eslint / prettier | latest | + prettier-plugin-tailwindcss |

**تصمیم مهم:** به‌جای Auth.js از یک لایه Session سفارشی با jose
استفاده شد، چون Flow این پروژه فقط Mobile+OTP است و Auth.js Overhead
غیرلازمی اضافه می‌کند - مطابق اصل «عدم پیچیده‌سازی بی‌دلیل» (بند ۷۹).

**تصمیم مهم:** Next.js 16 نام middleware.ts را به proxy.ts تغییر داده
(عملکرد یکسان). فایل پروژه src/proxy.ts است، نه middleware.ts.

## 8. Folder Structure

```
src/
  app/
    (dashboard)/dashboard/     - Route Group برای Dashboard
    (storefront)/              - Route Group برای Storefront (بعدا)
    api/v1/auth/otp/{request,verify}/  - اسکلت آماده، هنوز پیاده‌سازی نشده
    layout.tsx, page.tsx, globals.css
  components/
    ui/            - Primitives (Button, Input, Card, ...)
    dashboard/
    storefront/
    shared/
  config/env.ts
  fonts/index.ts
  lib/
    auth/  session.ts, otp.ts
    db/    connect.ts
    constants/rbac.ts
    utils/ api-response.ts
    validations/
  models/  User.ts, Otp.ts
  proxy.ts
  types/
public/fonts/  - IRANYekanX woff2 (۴ وزن)
```

## 9. Database Models

### User
phoneNumber (unique)، fullName؟، role (enum RBAC)، isActive،
lastLoginAt؟، deletedAt (Soft Delete)، timestamps.
Query Middleware به‌صورت خودکار کاربران Soft-deleted را فیلتر می‌کند.

### Otp
phoneNumber، codeHash (HMAC، نه Plaintext)، expiresAt (TTL Index -
MongoDB خودش سند را پاک می‌کند)، attempts، consumedAt؟، requestedIp؟.

**Planned models (هنوز ساخته نشده):** Category (max depth 2)، Product،
Variant، Inventory، Order، Payment، Discount، AmazingOffer، Address.

## 10. UI System (Design Tokens)

منبع: src/app/globals.css، منطبق با بخش ۱۳-۱۷ Master Prompt.

- **Background:** سفید (--background: #ffffff) - فقط Light Mode
- **Border:** #e4e4e7 (Light Gray)
- **Primary/Accent:** Indigo #4f46e5 - فقط برای CTA و Highlight،
  نه پس‌زمینه گسترده
- **Radius:** ظریف - sm: 6px, md: 10px, lg: 14px (هرگز Bubble-like)
- **Font:** IRANYekanX Pro - فقط ۴ وزن رجیستر شده (400/500/600/700)
- **جهت:** dir="rtl" روی html، lang="fa"
- **Product Image Ratio:** 3:4 (باید در Card/Gallery/Cropper/Preview
  یکپارچه اعمال شود - هنوز پیاده‌سازی نشده)

فایل Skill طراحی کاربر (mobile-app-ui-design) به‌عنوان مرجع اصول کلی
(Grid ۸ نقطه‌ای، Hierarchy تایپوگرافی، Thumb Zone، Peak-End) استفاده
می‌شود، اما پیش‌فرض‌های ظاهری آن (Radius بزرگ، Glassmorphism گسترده) که
با Master Prompt در تضاد بودند، نادیده گرفته شدند - Master Prompt
همیشه اولویت دارد.

## 11. Git Workflow

Branch Naming: {feature}/{sub-feature?}/{ui|backend} - مثلا
dashboard/users/ui، products/backend.

فرآیند اجباری هر Feature:
```
UI -> UI Test -> UI Approval -> Backend -> Backend Test ->
Integration -> Final Test -> User Approval -> Merge to main
```
هیچ Merge‌ای بدون تأیید صریح کاربر انجام نمی‌شود.

## 12. Completed Git Branches

- main - Initial Project Setup (این Commit)

## 13. Important Decisions Log

| مرحله | تصمیم | دلیل |
|---|---|---|
| Bootstrap | TypeScript (نه JavaScript) | طبق تأکید صریح کاربر و بند ۷ Master Prompt |
| Bootstrap | Auth.js را کنار گذاشتیم، Session سفارشی با jose | Flow ساده Mobile+OTP، پرهیز از Over-engineering |
| Bootstrap | فقط ۴ وزن فونت رجیستر شد (نه ۱۱ وزن) | کاهش حجم Bundle، مطابق اصل حداکثر ۲ وزن تایپوگرافی |
| Bootstrap | Repo موجود (mohamadpersboy/cms) که قبلا Reset شده بود مجددا استفاده شد | درخواست قبلی کاربر برای Reset کامل |
| Bootstrap | Payment Gateway هنوز انتخاب نشده | معماری Provider-Agnostic آماده می‌شود؛ تصمیم گیت‌وی بعدا |
| Bootstrap | Claude مستقیما Git را مدیریت می‌کند (کاربر خودش Commit/Push نمی‌کند) | تصمیم صریح کاربر - Vercel مستقیم به GitHub وصل است |

## 14. Known Issues

هیچ - پروژه تازه Bootstrap شده.

## 15. TODO (نزدیک)

- [ ] طراحی Dashboard Layout (Sidebar + Topbar + Mobile Drawer)
- [ ] KPI Cards با Mock Data
- [ ] Charts placeholder
- [ ] پیاده‌سازی واقعی /api/v1/auth/otp/request و /verify
  (اسکلت پوشه ساخته شده، منطق خالی است)
- [ ] منطق Atomic اولین کاربر = Super Admin

## 16. Do Not Change (بدون دلیل قوی)

- فرمت پاسخ API (apiSuccess/apiError) - در کل پروژه باید یکسان بماند
- نام‌گذاری Branch ({feature}/{ui|backend})
- Design Tokens پایه (رنگ Primary، Radius) - تغییر باید تصمیم آگاهانه
  با تأیید کاربر باشد
- استفاده از src/proxy.ts (نه middleware.ts) - نام‌گذاری Next.js 16

## 17. Environment Variables

نام کامل در .env.example. خلاصه:
MONGODB_URI, AUTH_SECRET, OTP_HASH_SECRET, CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, SMS_IR_API_KEY,
SMS_IR_LINE_NUMBER, NEXT_PUBLIC_APP_URL, NODE_ENV.

هیچ مقدار واقعی Secret هرگز نباید Commit شود. .env.local در
.gitignore است (الگوی .env*).

## 18. Deployment Notes

- Vercel مستقیما به این Repository (mohamadpersboy/cms, branch main)
  وصل است. کاربر خودش هیچ Commit/Push‌ای انجام نمی‌دهد - Claude مستقیما
  Git را مدیریت می‌کند. Environment Variables باید در Vercel Dashboard
  تعریف شوند (لیست بخش ۱۷).
- next.config.ts هنوز پیش‌فرض است - تنظیمات Image Domains برای
  Cloudinary باید موقع Wire شدن Feature تصاویر اضافه شود.
