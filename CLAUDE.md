@AGENTS.md

# CLAUDE.md — فرش سقطچی (فروشگاه اینترنتی تخصصی فرش)

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

**مرحله:** Dashboard (UI + Backend) — Merge شد به `main` ✅
**Branch فعلی:** `main`
**Feature بعدی:** Users Management (`users/ui` → `users/backend`)

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

### Dashboard UI (branch `dashboard/ui`)

- UI Primitives: Button، Card، Badge، Skeleton، EmptyState، ErrorState
- `DashboardShell`: Sidebar ثابت (Desktop) + Drawer موبایل + Topbar با
  منوی کاربر
- Navigation config متمرکز (`src/lib/constants/dashboard-nav.ts`) —
  بخش‌های بدون Backend به‌صورت غیرفعال با برچسب «به‌زودی» نمایش داده
  می‌شوند (نه Fake Functionality)
- صفحه Overview: ۸ KPI Card، نمودار روند فروش (Recharts/Area)، توزیع
  وضعیت سفارش‌ها، جدول سفارش‌های اخیر، لیست پرفروش‌ترین محصولات
- `loading.tsx` (Skeleton) و `error.tsx` (Retry) برای مسیر `/dashboard`
- صفحه Placeholder `/login` (فقط برای این‌که Redirect بهینه `proxy.ts`
  به یک صفحه واقعی برسد — پیاده‌سازی واقعی OTP در Feature بعدی)
- تمام داده‌های این فاز از `src/lib/mock/dashboard.ts` می‌آید و به‌صراحت
  با کامنت/بنر زرد در صفحه به‌عنوان Mock علامت‌گذاری شده (طبق قانون
  «No Fake Data»)
- فرمت‌دهی اعداد/مبلغ فارسی (`src/lib/utils/format.ts`)

### Dashboard Backend (branch `dashboard/backend`)

- **OTP Authentication واقعی، سرتاسری:**
  - `POST /api/v1/auth/otp/request` — Validation (Zod)، Cooldown ۶۰
    ثانیه، محدودیت ۵ درخواست در ساعت، ارسال پیامک واقعی از طریق
    sms.ir (متد Bulk، پیام سفارشی، نه Template آماده)
  - `POST /api/v1/auth/otp/verify` — بررسی Hash (HMAC)، محدودیت ۵ تلاش
    ناموفق، تعیین اتمیک اولین کاربر = Super Admin
    (`src/models/SystemFlag.ts` — با `insert` روی ایندکس Unique، نه
    `count()===0`، پس Race-Condition-Safe)، ست‌کردن Session Cookie
    (HttpOnly, Secure در Production)
  - `POST /api/v1/auth/logout` — پاک‌کردن Cookie
- `src/lib/sms/send-otp-sms.ts` — کلاینت sms.ir، متد **Pattern/Verify**
  (endpoint: `POST https://api.sms.ir/v1/send/verify`) با
  `templateId` تأییدشده (`SMS_IR_OTP_TEMPLATE_ID=963650`) و پارامتر
  `Code` — این متد برای OTP از خط خدماتی با اولویت بالا ارسال می‌شود و
  حتی برای کاربرانی که پیامک تبلیغاتی را مسدود کرده‌اند هم می‌رسد
  (بر خلاف متد Bulk که ابتدا استفاده شده بود)
- `src/lib/auth/current-user.ts` — خواندن و اعتبارسنجی Session در
  Server Component/Route Handler (لایه Authorization واقعی)
- فرم واقعی ورود دو مرحله‌ای (موبایل → کد) در `/login`
  (`src/components/auth/otp-login-form.tsx`) — جایگزین Placeholder قبلی
- `src/app/(dashboard)/dashboard/layout.tsx` حالا Session واقعی را از
  `getCurrentUser()` می‌خواند و در صورت نبود Session یا نقش `customer`
  Redirect می‌کند (Defense in depth — مستقل از `proxy.ts`)
- `DashboardShell` به نام/شماره/نقش واقعی کاربر و دکمه خروج واقعی وصل شد
- Drawer موبایل حالا با انیمیشن باز/بسته می‌شود (اسلاید از راست +
  Fade پس‌زمینه، ۲۵۰ میلی‌ثانیه) به‌جای ظاهر/ناپدید شدن یکباره
- **`src/proxy.ts` دوباره فعال شد** — دلیل غیرفعال‌سازی قبلی (نبود Auth
  واقعی برای Preview) دیگر برطرف شده
- KPI «تعداد مشتریان» اکنون از دیتابیس واقعی خوانده می‌شود
  (`User.countDocuments({role:'customer'})`)؛ بقیه KPIها/نمودارها هنوز
  Mock هستند چون Modelهای Product/Order هنوز ساخته نشده‌اند (به ترتیب
  در Featureهای بعدی)
- تست‌های واحد (Vitest) برای منطق حساس: تولید/Hash کردن OTP، Validation
  شماره موبایل و کد — ۱۶ تست، همه موفق (`npm run test`)

## 4. In Progress

هیچ Feature‌ای در حال توسعه نیست. Dashboard (UI+Backend) به `main`
Merge شد و کاربر تأیید کرد. منتظر شروع Feature بعدی: Users Management.

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
| vitest | latest | Unit test برای منطق حساس (OTP hash، Validation) |

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

- main - Initial Project Setup + Dashboard UI + Dashboard Backend (Merged ✅)
- dashboard/ui - Merged into main
- dashboard/backend - Merged into main

## 13. Important Decisions Log

| مرحله | تصمیم | دلیل |
|---|---|---|
| Bootstrap | TypeScript (نه JavaScript) | طبق تأکید صریح کاربر و بند ۷ Master Prompt |
| Bootstrap | Auth.js را کنار گذاشتیم، Session سفارشی با jose | Flow ساده Mobile+OTP، پرهیز از Over-engineering |
| Bootstrap | فقط ۴ وزن فونت رجیستر شد (نه ۱۱ وزن) | کاهش حجم Bundle، مطابق اصل حداکثر ۲ وزن تایپوگرافی |
| Bootstrap | Repo موجود (mohamadpersboy/cms) که قبلا Reset شده بود مجددا استفاده شد | درخواست قبلی کاربر برای Reset کامل |
| Bootstrap | Payment Gateway هنوز انتخاب نشده | معماری Provider-Agnostic آماده می‌شود؛ تصمیم گیت‌وی بعدا |
| Bootstrap | Claude مستقیما Git را مدیریت می‌کند (کاربر خودش Commit/Push نمی‌کند) | تصمیم صریح کاربر - Vercel مستقیم به GitHub وصل است |
| Dashboard Backend | متد Pattern/Verify sms.ir (نه Bulk) با Template ID تأییدشده `963650` | خود مستندات sms.ir این متد را برای OTP توصیه می‌کند: اولویت بالا از خط خدماتی، حتی برای کاربرانی که پیامک تبلیغاتی را مسدود کرده‌اند هم می‌رسد؛ متد Bulk اولیه (که ابتدا انتخاب شده بود) این تضمین‌ها را نداشت |
| Dashboard Backend | اولین Super Admin با insert روی Unique Index، نه findOneAndUpdate($ne) | ساده‌تر و قطعا Atomic؛ خطای Duplicate-Key رقابت را حل می‌کند |
| Dashboard Backend | proxy.ts دوباره فعال شد | دلیل غیرفعال‌سازی قبلی (نبود Auth واقعی برای Preview) دیگر برطرف شده |
| Dashboard Backend | NEXT_PUBLIC_APP_URL اکنون از VERCEL_URL خودکار Vercel استخراج می‌شود اگر تنظیم نشده باشد، و https:// را خودکار اضافه می‌کند اگر بدون Protocol وارد شده باشد | رفع خطای واقعی Build: "Invalid URL" - چون هر Preview روی Vercel آدرس متفاوتی دارد و نمی‌شود یک مقدار ثابت دستی برایش گذاشت |

## 14. Known Issues

- **حل‌شده:** غیرفعال‌سازی موقت Auth روی `/dashboard` (که قبلاً برای
  بررسی UI فعال شده بود) اکنون که OTP Auth واقعی ساخته شده، برداشته
  شد — `proxy.ts` دوباره فعال است.
- **محدودیت شناخته‌شده:** اگر بعد از `claimFirstAdminSlot()` (قفل اولین
  Super Admin) ساخت User به هر دلیلی شکست بخورد، پرچم قفل‌شده باقی
  می‌ماند و دیگر هیچ کاربری Super Admin نمی‌شود (نیاز به رفع دستی در
  دیتابیس). این حالت بسیار نادر است (فقط اگر دیتابیس بین دو Write قطع
  شود) و برای سادگی فعلاً به همین شکل پذیرفته شده — قابل بهبود در آینده
  با یک الگوی Transaction.
- **هنوز تست End-to-End واقعی نشده:** به‌دلیل نبود دسترسی شبکه به
  MongoDB/sms.ir در محیط توسعه Claude، فقط Lint/Typecheck/Build/Unit
  Test اجرا شده. تست واقعی ورود با شماره موبایل واقعی باید روی
  Vercel Preview (با Environment Variables واقعی) توسط کاربر انجام شود.

## 15. TODO (نزدیک)

- [ ] شروع Feature بعدی: Users Management
  - [ ] `users/ui`: صفحه لیست کاربران (جدول + جستجو + Pagination UI + فیلتر نقش)، صفحه جزئیات کاربر
  - [ ] تست و تأیید UI
  - [ ] `users/backend`: API لیست/جستجو/Pagination واقعی (mongoose-paginate-v2)، تغییر Role، فعال/غیرفعال کردن کاربر — همه با Authorization سمت سرور (فقط super_admin/admin)
  - [ ] Merge به `main` پس از تأیید

## 16. Do Not Change (بدون دلیل قوی)

- فرمت پاسخ API (apiSuccess/apiError) - در کل پروژه باید یکسان بماند
- نام‌گذاری Branch ({feature}/{ui|backend})
- Design Tokens پایه (رنگ Primary، Radius) - تغییر باید تصمیم آگاهانه
  با تأیید کاربر باشد
- ایمیل Commit Author باید همیشه `persboy.dev@gmail.com` باشد (باید با
  ایمیل حساب GitHub مطابقت داشته باشد، وگرنه Vercel Deployment را با
  خطای "Deployment Blocked - Fix Git Configuration" مسدود می‌کند)

## 17. Environment Variables

نام کامل در .env.example. خلاصه:
MONGODB_URI, AUTH_SECRET, OTP_HASH_SECRET, CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, SMS_IR_API_KEY,
SMS_IR_LINE_NUMBER, SMS_IR_OTP_TEMPLATE_ID, NEXT_PUBLIC_APP_URL,
NODE_ENV.

SMS_IR_OTP_TEMPLATE_ID فعلاً `963650` است (Template تأییدشده در پنل
sms.ir با یک پارامتر به نام Code). SMS_IR_LINE_NUMBER فعلاً فقط برای
استفاده احتمالی آینده از متد Bulk نگه داشته شده - OTP از آن استفاده
نمی‌کند.

هیچ مقدار واقعی Secret هرگز نباید Commit شود. .env.local در
.gitignore است (الگوی .env*).

## 18. Deployment Notes

- Vercel مستقیما به این Repository (mohamadpersboy/cms, branch main)
  وصل است. کاربر خودش هیچ Commit/Push‌ای انجام نمی‌دهد - Claude مستقیما
  Git را مدیریت می‌کند. Environment Variables باید در Vercel Dashboard
  تعریف شوند (لیست بخش ۱۷).
- next.config.ts هنوز پیش‌فرض است - تنظیمات Image Domains برای
  Cloudinary باید موقع Wire شدن Feature تصاویر اضافه شود.
