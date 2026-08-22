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

**مرحله:** Categories UI — Merge شد به `main` ✅
**Branch فعلی:** `main` (طبق سیاست جدید، همیشه `main` — بخش ۱۱ را ببینید)
**Feature بعدی:** Categories Backend (مدل واقعی + API)

**تصمیم معماری:** ترتیب Featureهای بعدی از «Users → Products →
Categories» به «Users → **Categories** → Products» تغییر کرد، چون
`Product.category` یک فیلد اجباری است که به `Category` وصل می‌شود —
منطقی نبود فرم ساخت محصول را قبل از وجود دسته‌بندی واقعی بسازیم.

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

### Users Management UI (branch `users/ui`)

- صفحه لیست کاربران (`/dashboard/users`): جستجو (نام/موبایل) و فیلتر
  نقش که **واقعاً** روی داده Mock کار می‌کنند (فقط منبع داده Mock است،
  خود جستجو/فیلتر/Pagination واقعی و Functional هستند)، Pagination
  کلاینتی، Empty State، `loading.tsx`/`error.tsx`
- صفحه جزئیات کاربر (`/dashboard/users/[id]`): اطلاعات کاربر، تعداد
  سفارش، تاریخ عضویت/آخرین ورود؛ کنترل‌های «تغییر نقش» و
  «فعال/غیرفعال‌سازی» **عمداً غیرفعال (disabled)** با توضیح صریح که
  چون Backend هنوز وصل نشده — طبق قانون «No Fake Data» دکمه‌ای که کاری
  واقعی انجام نمی‌دهد نباید فعال به نظر برسد
- Componentهای جدید: `RoleBadge`, `UserStatusBadge`, `Pagination`,
  `Select` (اضافه به UI primitives)
- نقش «کاربران» در Navigation فعال شد
- `src/lib/mock/users.ts` — ۲۴ کاربر نمایشی (بدون `Math.random()` تا
  Hydration Mismatch رخ ندهد — از فرمول قطعی استفاده شده)

### Users Management Backend (branch `users/backend`)

- **API واقعی:**
  - `GET /api/v1/users` — لیست با Pagination واقعی
    (`mongoose-paginate-v2`)، جستجو (نام/موبایل با Regex Escape‌شده)،
    فیلتر نقش
  - `GET /api/v1/users/[id]` — جزئیات یک کاربر
  - `PATCH /api/v1/users/[id]/role` — تغییر نقش
  - `PATCH /api/v1/users/[id]/status` — فعال/غیرفعال‌سازی
- `src/lib/auth/api-guard.ts` — `requireApiUser(permission)`: لایه
  Authorization واقعی روی هر Route (مستقل از `proxy.ts` و
  Dashboard Layout که فقط ناوبری صفحه را کنترل می‌کنند)
- **قوانین امنیتی مهم پیاده‌سازی‌شده** (`canAssignRole` در
  `rbac.ts` + منطق داخل Routeها):
  - هیچ‌کس (حتی Super Admin) نمی‌تواند نقش/وضعیت حساب خودش را از این
    مسیر تغییر دهد (جلوگیری از قفل‌شدن تصادفی)
  - فقط Super Admin می‌تواند نقش `admin`/`super_admin` اعطا کند —
    Admin نمی‌تواند خودش یا دیگری را Admin کند (جلوگیری از
    Privilege Escalation)
  - Admin نمی‌تواند نقش/وضعیت یک Admin یا Super Admin دیگر را تغییر دهد
  - غیرفعال‌کردن یا تنزل آخرین Super Admin فعال سیستم مسدود می‌شود
    (همیشه حداقل یک Super Admin فعال باقی می‌ماند)
- `admin` اکنون permission `users.update` هم دارد (قبلاً فقط `read`)
- Frontend به API واقعی وصل شد:
  - لیست کاربران: Fetch واقعی با Debounce جستجو (۴۰۰ms)، Loading با
    `useTransition` (React 19 — بدون setState همزمان داخل Effect)،
    Error State با Retry
  - جزئیات کاربر: Select نقش و دکمه غیرفعال‌سازی اکنون واقعاً کار
    می‌کنند؛ `ConfirmDialog` جدید برای تأیید عملیات حساس (غیرفعال‌سازی)
    طبق بند ۷۸ Master Prompt
- `src/lib/mock/users.ts` حذف شد (Dead Code — دیگر استفاده نمی‌شود)
- ۴ Unit Test جدید برای `canAssignRole` (جلوگیری از Privilege
  Escalation) — مجموعاً ۲۰ تست، همه موفق

### Categories UI (branch `categories/ui`)

- `/dashboard/categories`: نمای درختی دو سطحی (باز/بسته‌شدن زیردسته‌ها)
  روی داده Mock (۸ دسته اصلی، برخی با زیردسته، مطابق لیست بند ۱۸
  Master Prompt: فرش ماشینی، موکت، کناره، پشتی، تابلو فرش، روفرشی،
  پادری، قالیچه)
- `/dashboard/categories/new` و `/dashboard/categories/[id]/edit`: فرم
  مشترک (`CategoryForm`) با تولید خودکار Slug از نام (فقط برای ورودی
  لاتین کار می‌کند، طبق تست‌های `slugify`)
- **محدودیت عمق ۲ سطح در همین لایه UI هم اعمال شده:** فیلد «والد» فقط
  دسته‌های سطح اول را نشان می‌دهد، و اگر دسته‌ای در حال ویرایش خودش
  زیردسته داشته باشد، فیلد والد غیرفعال می‌شود (نمی‌تواند زیرمجموعه
  شود چون خودش زیردسته دارد)
- حذف با `ConfirmDialog` (هشدار جداگانه اگر دسته زیردسته هم داشته باشد)
- `src/lib/utils/slugify.ts` + ۵ Unit Test — مجموعاً ۲۵ تست
- Add/Edit/Delete فقط روی State محلی React شبیه‌سازی می‌شود (با Refresh
  از بین می‌رود) — به‌صراحت با بنر زرد اعلام شده، طبق «No Fake Data»
- نقش «دسته‌بندی‌ها» در Navigation فعال شد
- **`src/proxy.ts` دوباره فعال شد** — دلیل غیرفعال‌سازی قبلی (نبود Auth
  واقعی برای Preview) دیگر برطرف شده
- KPI «تعداد مشتریان» اکنون از دیتابیس واقعی خوانده می‌شود
  (`User.countDocuments({role:'customer'})`)؛ بقیه KPIها/نمودارها هنوز
  Mock هستند چون Modelهای Product/Order هنوز ساخته نشده‌اند (به ترتیب
  در Featureهای بعدی)
- تست‌های واحد (Vitest) برای منطق حساس: تولید/Hash کردن OTP، Validation
  شماره موبایل و کد — ۱۶ تست، همه موفق (`npm run test`)

## 4. In Progress

Categories UI به `main` Merge شد. طبق سیاست جدید (push مستقیم روی
main)، Categories Backend همینجا روی main ادامه پیدا می‌کند.

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

**⚠️ تغییر سیاست (تصمیم صریح کاربر):** از این مرحله به بعد،
Push مستقیماً روی `main` انجام می‌شود — بدون Branch جداگانه برای هر
Feature و بدون توقف برای تأیید UI/Backend به‌صورت جدا. دلیل: تست هر
مرحله نیاز به Login واقعی با OTP دارد که هزینه پیامک واقعی روی کاربر
می‌گذارد؛ Branch/Approval جداگانه برای UI و Backand این هزینه را
دوبرابر می‌کرد.

**آنچه همچنان قبل از هر Push رعایت می‌شود** (کیفیت فدای سرعت نمی‌شود):
- Lint، Typecheck، Test، Build باید همه سبز باشند
- `CLAUDE.md` بعد از هر تغییر مهم به‌روز می‌شود
- Commit Messageهای واضح و توصیفی
- هنوز هیچ Secret/کلید واقعی Commit نمی‌شود

**آنچه دیگر اعمال نمی‌شود:** ساخت Branch جدا برای هر Feature، توقف
میان‌مرحله‌ای برای تأیید صریح قبل از هر Merge. اگر کاربر بخواهد به
سیاست قبلی (Branch جدا + تأیید مرحله‌ای) برگردد، کافی است اعلام کند.

Branch Naming (در صورت نیاز به Branch موقت برای کاری پرریسک):
{feature}/{sub-feature?}/{ui|backend}.

## 12. Completed Git Branches

- main - Initial Project Setup + Dashboard (UI+Backend) + Users Management (UI+Backend) + Categories UI + Vercel env sync script (Merged ✅)
- dashboard/ui, dashboard/backend, users/ui, users/backend, categories/ui, chore/vercel-env-sync - Merged و حذف شدند
- از این پس (طبق سیاست جدید بالا) توسعه مستقیماً روی main ثبت می‌شود
- categories/ui - نمای درختی + فرم دسته‌بندی (Mock Data) - در انتظار تأیید، هنوز Merge نشده

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
| Categories UI | ترتیب Feature از Products به Categories تغییر کرد | Product.category اجباری و به Category وابسته است |
| بعد از Categories UI | Push مستقیم روی main، بدون Branch/Approval جدا برای هر مرحله | تصمیم صریح کاربر - تست هر مرحله نیاز به OTP واقعی دارد و هزینه پیامک روی کاربر است؛ Lint/Test/Build همچنان قبل از هر Push اجباری می‌ماند |

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

- [ ] تست/تأیید کاربر روی `categories/ui`
- [ ] `categories/backend`: مدل Category (Mongoose، Validation عمق ۲
  سطح در Server هم، نه فقط UI)، API کامل CRUD، Slug یکتا
- [ ] Merge به `main` پس از تأیید
- [ ] شروع Feature بعدی: Products (که حالا به Category واقعی وصل می‌شود)

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
- **`scripts/vercel-env-sync.sh`**: اسکریپت کمکی برای ثبت یکجای همه‌ی
  Environment Variableها روی هر سه محیط Vercel (Production/Preview/
  Development) با استفاده از Vercel CLI، به‌جای وارد کردن دستی هر
  متغیر در Dashboard برای هر Deployment. کاربر باید `.env.vercel.local`
  را از روی `.env.vercel.local.example` بسازد (این فایل هرگز Commit
  نمی‌شود) و یک‌بار محلی اجرا کند. Claude نمی‌تواند این اسکریپت را از
  محیط خودش اجرا کند چون Sandbox Claude به `api.vercel.com` دسترسی
  شبکه ندارد (فقط دامنه‌های محدودی مثل GitHub/npm مجاز هستند) —
  مستندات کامل در README بخش Environment Variables.
- next.config.ts هنوز پیش‌فرض است - تنظیمات Image Domains برای
  Cloudinary باید موقع Wire شدن Feature تصاویر اضافه شود.
