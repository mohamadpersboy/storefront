@AGENTS.md

# CLAUDE.md — فرش سقطچی (فروشگاه اینترنتی تخصصی فرش)

> این فایل مرجع اصلی پروژه است. اگر Chat جدید باز شد یا Context قبلی
> از دست رفت، فقط با خواندن این فایل و README.md باید بتوانی ادامه
> بدهی. هر تصمیم معماری مهم باید همین‌جا ثبت شود، نه فقط در چت.
>
> این فایل یک "State Snapshot" است، نه یک Changelog تاریخی — هر بخش
> باید وضعیت *فعلی* را نشان دهد، نه ترتیب زمانی کاری که انجام شده.

---

## 1. Project Overview

فروشگاه اینترنتی تخصصی محصولات فرش برای بازار ایران (RTL، فارسی).
یک پلتفرم کامل شامل Storefront + Dashboard مدیریتی با مدیریت محصول/
Variant/موجودی/سفارش/پرداخت/تخفیف. Full specification در پرامپت اصلی
کاربر (Master Prompt) آمده؛ همه تصمیمات باید با آن سازگار باشند.

قوانین کلیدی:
- **Dashboard First:** تا تکمیل کامل Dashboard، Storefront شروع نمی‌شود.
- Mock Data در UI مجاز است ولی باید واضحاً مشخص باشد و هرگز به‌جای
  Backend واقعی معرفی نشود.
- Git Workflow فعلی: بخش ۱۱ را ببینید (سیاست تغییر کرده).

## 2. Current Status

**آخرین Feature تکمیل‌شده:** Products + رفع دو مشکل (Select بومی →
Combobox سفارشی در کل پروژه، دکمه حذف محصول اضافه شد)
**Branch فعلی:** `main`
**Feature بعدی:** Orders

## 3. Completed Features

- ✅ Bootstrap پروژه (Next.js 16.3، TypeScript، Tailwind v4، فونت،
  Design Tokens، ساختار پوشه‌ای)
- ✅ Authentication واقعی: OTP با sms.ir (متد Pattern/Verify)، Session
  با jose، اولین کاربر = Super Admin (Atomic)، RBAC کامل
- ✅ Dashboard: Layout (Sidebar/Topbar/Drawer با انیمیشن)، صفحه
  Overview با KPI/نمودار/جدول (بخشی Mock، «تعداد مشتریان» واقعی)
- ✅ Users Management: لیست با Pagination/جستجو/فیلتر واقعی، جزئیات
  کاربر، تغییر نقش و فعال/غیرفعال‌سازی با Authorization و محافظت‌های
  امنیتی کامل
- ✅ Categories Management: نمای درختی ۲ سطحی، CRUD کامل، Validation
  عمق در Server (نه فقط UI)
- ✅ Products Management: مدل کامل (Variant تعبیه‌شده با واحد/ویژگی/
  قیمت/تخفیف/موجودی، ویژگی‌های فنی Flexible، تصاویر)، آپلود واقعی
  تصویر به Cloudinary با Cropper نسبت ۳:۴، لیست با جستجو/فیلتر/
  Pagination، فرم کامل ساخت/ویرایش، Soft Delete
- ✅ ابزار `scripts/vercel-env-sync.sh` برای تنظیم یکجای Environment
  Variables (کاربر دستی استفاده کرد، فعلاً نیازی به اجرای مجدد نیست)

## 4. In Progress

هیچ‌کدام — منتظر شروع Products.

## 5. Planned (به ترتیب)

1. **Orders** (بعدی)
2. Discounts + Amazing Offers (شامل startAt/endAt برای Amazing Offer —
   عمداً از Products جدا نگه داشته شد، طبق بند ۲۵-۲۶ Master Prompt)
3. Customers (نمای مدیریتی جدا از Users، تمرکز روی مشتریان)
4. Settings
5. بعد از تکمیل کامل Dashboard: شروع Storefront (Home, Products,
   Category, Product Detail, Search, Cart, Checkout, Account, ...)

## 6. Architecture

**نوع:** Next.js App Router، Full-stack یکپارچه. API Routes زیر
`src/app/api/v1/...` (Versioned).

**لایه‌بندی:**
```
app/          - Routes (UI + API) - نازک، فقط orchestration
lib/          - Business logic, DB, auth, utils, validations
models/       - Mongoose Schemas
components/   - UI (ui/ = primitives, dashboard/, users/, categories/, ...)
config/       - env, app-wide constants
fonts/        - next/font/local loaders
```

**Auth Flow:** Mobile Number + OTP (sms.ir Pattern/Verify) → Session
Cookie (JWT با jose، HttpOnly، Secure در Production). اولین کاربر
تأییدشده = Super Admin، با یک Atomic insert روی Unique Index
(`src/models/SystemFlag.ts`) — نه `count()===0` که Race Condition دارد.

**Authorization (۳ لایه، هرکدام مستقل):**
1. `src/proxy.ts` — Optimistic redirect برای `/dashboard/*` (فقط UX،
   نه امنیت واقعی)
2. `src/app/(dashboard)/dashboard/layout.tsx` — Session واقعی از
   `getCurrentUser()`، Redirect اگر نبود یا نقش `customer` بود
3. `src/lib/auth/api-guard.ts` (`requireApiUser(permission)`) — لایه
   واقعی روی **هر** API Route؛ این تنها لایه‌ای است که واقعاً قابل
   اتکاست، چون ۱ و ۲ فقط ناوبری صفحه را کنترل می‌کنند نه هر Request را

**API Response Format (ثابت در کل پروژه):**
```
موفق: { success: true, data: T, message?: string, pagination?: {...} }
خطا:  { success: false, message: string, errors?: Record<string, string[]> }
```
هلپرها: `src/lib/utils/api-response.ts` (`apiSuccess`/`apiError`).

## 7. Tech Stack

| Package | Version | یادداشت |
|---|---|---|
| next | 16.3.1 | App Router, Turbopack, `proxy.ts` (نام جدید middleware از v16) |
| react / react-dom | 19.2.8 | |
| typescript | ^5 | |
| tailwindcss | ^4 | CSS-first config (`@theme inline` در globals.css) |
| mongoose | 9.9.3 | |
| mongoose-paginate-v2 | 1.9.5 | Pagination (لیست کاربران) |
| cloudinary | 2.10.1 | نصب شده، هنوز Wire نشده (Feature Products) |
| zod | 4.4.3 | Validation (Client + Server) |
| jose | 6.2.9 | JWT - Edge-runtime-safe |
| lucide-react | 1.33.0 | آیکون |
| recharts | 3.10.1 | نمودار Dashboard |
| clsx + tailwind-merge | - | ترکیب کلاس‌های Tailwind |
| vitest | latest | Unit Test |
| eslint / prettier | latest | + prettier-plugin-tailwindcss |

**تصمیمات مهم Stack:**
- Auth.js استفاده نشد؛ Session سفارشی با jose (Flow ساده Mobile+OTP،
  پرهیز از Over-engineering طبق بند ۷۹ Master Prompt)
- فقط ۴ وزن فونت IRANYekanX رجیستر شده (نه هر ۱۱ تا) — کاهش حجم Bundle
- `src/proxy.ts` نه `middleware.ts` (تغییر نام‌گذاری Next.js 16)

## 8. Folder Structure

```
src/
  app/
    (dashboard)/dashboard/
      page.tsx, layout.tsx, loading.tsx, error.tsx
      users/  page.tsx + [id]/page.tsx
      categories/  page.tsx + new/ + [id]/edit/
      products/  page.tsx + new/ + [id]/edit/ + loading.tsx + error.tsx
    (storefront)/              - هنوز خالی
    api/v1/
      auth/  otp/{request,verify}/route.ts, logout/route.ts
      users/  route.ts + [id]/route.ts + [id]/role/route.ts + [id]/status/route.ts
      categories/  route.ts + [id]/route.ts
      products/  route.ts + [id]/route.ts
      uploads/sign/route.ts
    login/page.tsx
    layout.tsx, page.tsx, globals.css
  components/
    ui/         - Button, Card, Badge, Input, Textarea, Combobox,
                  Pagination, Skeleton, EmptyState, ErrorState, ConfirmDialog
    dashboard/  - DashboardShell, KpiCard, charts, ...
    users/      - RoleBadge, UserStatusBadge, users-page-client, ...
    categories/ - CategoriesTree, CategoryForm
    products/   - ProductForm, ProductImageUploader, ImageCropModal,
                  VariantEditor, TechnicalSpecsEditor, ProductStatusBadge,
                  products-page-client
    auth/       - OtpLoginForm
  config/env.ts
  fonts/index.ts
  lib/
    auth/       session.ts, otp.ts, current-user.ts, api-guard.ts
    cloudinary/ config.ts (server-only — signed uploads, secret never in client)
    db/         connect.ts
    constants/  rbac.ts, dashboard-nav.ts
    sms/        send-otp-sms.ts
    utils/      api-response.ts, cn.ts, format.ts, slugify.ts,
                pricing.ts, image-crop.ts
    validations/ auth.ts, users.ts, categories.ts, category-depth.ts, products.ts
    mock/       dashboard.ts (فقط همین باقی مانده Mock)
  models/       User.ts, Otp.ts, SystemFlag.ts, Category.ts, Product.ts
  proxy.ts
public/fonts/  - IRANYekanX woff2 (۴ وزن)
scripts/vercel-env-sync.sh
```

## 9. Database Models

### User
`phoneNumber` (unique), `fullName?`, `role` (enum RBAC), `isActive`,
`lastLoginAt?`, `deletedAt` (Soft Delete), timestamps. Query Middleware
خودکار کاربران Soft-deleted را فیلتر می‌کند.

### Otp
`phoneNumber`, `codeHash` (HMAC، نه Plaintext), `expiresAt` (TTL Index
— MongoDB خودش پاک می‌کند), `attempts`, `consumedAt?`, `requestedIp?`.

### SystemFlag
`key` (unique), `value: boolean`. فقط برای قفل Atomic اولین Super Admin.

### Category
`name`, `slug` (unique, lowercase, `[a-z0-9-]+`), `parentId` (ref
Category | null — حداکثر عمق ۲ سطح، Validate شده در
`src/lib/validations/category-depth.ts` نه در خود Model)، `isActive`,
`sortOrder`, timestamps.

### Product
`title`, `slug` (unique)، `description?`, `technicalDescription?`,
`technicalSpecifications: {key,value}[]` (کاملاً Flexible، Hard-code
نشده)، `category` (ref Category, required)، `images: {url,publicId}[]`
(حداکثر ۱۰، از Cloudinary)، `variants` (حداقل ۱، هرکدام: `unit`
[تخته/عدد/جفت/متر/متر مربع]، `attributes: {name,value}[]` [رنگ/اندازه/
شانه/...]، `sku?`، `price`، `discountPercent`، `discountAmount`،
`stock`، `isActive`)، `status` (draft/published/archived)، `seo`
(title?/description?)، `deletedAt` (Soft Delete)، timestamps.

قیمت نهایی هر Variant با `computeFinalPrice()` در
`src/lib/utils/pricing.ts` محاسبه می‌شود (درصد و مبلغ ثابت هردو
پشتیبانی می‌شوند) — این تابع منبع واحد محاسبه قیمت در کل پروژه است،
هم API هم UI از همین استفاده می‌کنند.

**Planned models:** Order, Payment, Discount, AmazingOffer, Address.

## 10. UI System (Design Tokens)

منبع: `src/app/globals.css`، منطبق با بخش ۱۳-۱۷ Master Prompt.

- **Background:** سفید (`#ffffff`) — فقط Light Mode
- **Border:** `#e4e4e7` (Light Gray)
- **Primary/Accent:** Indigo `#4f46e5` — فقط CTA/Highlight، نه پس‌زمینه گسترده
- **Radius:** ظریف — `sm: 6px, md: 10px, lg: 14px` (هرگز Bubble-like)
- **Font:** IRANYekanX Pro (فقط ۴ وزن: 400/500/600/700)
- **جهت:** `dir="rtl"` روی `html`, `lang="fa"`
- **Product Image Ratio:** 3:4 (هنوز پیاده‌سازی نشده — موقع Products)

فایل Skill طراحی کاربر (`mobile-app-ui-design`) فقط برای اصول کلی
(Grid، Hierarchy، Thumb Zone) استفاده شد؛ پیش‌فرض‌های ظاهری متضاد با
Master Prompt (Radius بزرگ، Glassmorphism) نادیده گرفته شدند.

## 11. Git Workflow

**⚠️ سیاست فعلی (تصمیم صریح کاربر، جایگزین سیاست اولیه Master Prompt):**
Push مستقیماً روی `main` انجام می‌شود — بدون Branch جداگانه برای هر
Feature و بدون توقف برای تأیید UI/Backend جدا. دلیل: تست هر مرحله نیاز
به OTP واقعی دارد و هزینه پیامک روی کاربر است.

**همچنان اجباری قبل از هر Push:**
- Lint، Typecheck، Test، Build — همه باید سبز باشند
- به‌روزرسانی همین فایل (CLAUDE.md) بعد از هر تغییر مهم
- Commit Message واضح و توصیفی
- بدون Commit شدن هیچ Secret واقعی

**دیگر اعمال نمی‌شود:** Branch جدا به ازای هر Feature، توقف برای تأیید
میان‌مرحله‌ای. اگر کاربر بخواهد برگردد، کافی است اعلام کند.

## 12. Git History (خلاصه)

همه Featureهای بخش ۳ Merge شده‌اند؛ Branchهای موقت (`dashboard/ui`,
`dashboard/backend`, `users/ui`, `users/backend`, `categories/ui`,
`chore/vercel-env-sync`) بعد از Merge حذف شدند. از این پس طبق سیاست
بخش ۱۱، توسعه مستقیماً روی `main` ثبت می‌شود.

## 13. Important Decisions Log

| مرحله | تصمیم | دلیل |
|---|---|---|
| Bootstrap | TypeScript (نه JavaScript) | تأکید صریح کاربر + بند ۷ Master Prompt |
| Bootstrap | Auth.js کنار گذاشته شد، Session سفارشی با jose | Flow ساده Mobile+OTP، پرهیز از Over-engineering |
| Bootstrap | فقط ۴ وزن فونت رجیستر شد | کاهش حجم Bundle |
| Bootstrap | Repo موجود (mohamadpersboy/cms) که قبلاً Reset شده بود دوباره استفاده شد | درخواست قبلی کاربر |
| Bootstrap | Payment Gateway هنوز انتخاب نشده؛ معماری Provider-Agnostic | تصمیم گیت‌وی به بعد موکول شد |
| Bootstrap | Claude مستقیماً Git را مدیریت می‌کند | تصمیم صریح کاربر - Vercel مستقیم به GitHub وصل است |
| Dashboard Backend | متد Pattern/Verify sms.ir (نه Bulk) با Template ID `963650` | توصیه خود sms.ir برای OTP: اولویت بالا، حتی برای کاربران مسدودکننده تبلیغات هم می‌رسد |
| Dashboard Backend | اولین Super Admin با insert روی Unique Index | ساده و قطعاً Atomic؛ خطای Duplicate-Key رقابت را حل می‌کند |
| Dashboard Backend | NEXT_PUBLIC_APP_URL از VERCEL_URL خودکار استخراج می‌شود اگر ست نشده | رفع خطای Build "Invalid URL"؛ هر Preview آدرس متفاوت دارد |
| Categories | ترتیب Feature از Products به Categories تغییر کرد | Product.category اجباری و وابسته به Category است |
| Categories | Validation عمق ۲ سطح در یک Helper مستقل (`category-depth.ts`) نه در Mongoose Middleware | تایپ‌های Mongoose Middleware با async/this ناسازگار بودند؛ Helper ساده‌تر و قابل تست‌تر است |
| بعد از Categories UI | Push مستقیم روی main، بدون Branch/Approval جدا | تصمیم صریح کاربر - هزینه پیامک هر بار تست |
| Products | قیمت/تخفیف در سطح Variant، نه Product | هر Variant واحد فروش و قیمت متفاوت دارد (بند ۲۱)؛ تکرار فیلد قیمت در دو سطح منبع خطا می‌شد |
| Products | Amazing Offer (با startAt/endAt) به Feature جدا موکول شد، اینجا فقط discountPercent/discountAmount ساده در Variant | طبق ترتیب Master Prompt، Amazing Offer یک Feature مستقل با منطق Countdown/Expiry خودش است |
| Products | آپلود تصویر با Cloudinary Signed Upload (نه Unsigned Preset) | امضا سمت Server تولید می‌شود (Secret هرگز به Client نمی‌رسد)، ولی نیازی به ساخت Upload Preset در پنل Cloudinary هم نیست |
| Products | Cropper با react-easy-crop، نسبت ثابت ۳:۴ | الزام صریح بند ۴۲ Master Prompt |
| Products | حذف محصول = Soft Delete، تصاویر Cloudinary پاک نمی‌شوند | امکان Restore بدون از دست دادن تصاویر؛ پاک‌سازی دائمی Cloudinary یک اقدام مدیریتی جدا و ساخته‌نشده است |
| بعد از Products | `<select>` بومی HTML با `Combobox` سفارشی (`src/components/ui/combobox.tsx`) جایگزین شد در همه‌جا (دسته‌بندی، نقش، وضعیت) | بازخورد کاربر: `<select>` بومی روی موبایل یه Overlay تمام‌صفحه با همه گزینه‌ها باز می‌کند که با تعداد گزینه زیاد آزاردهنده است؛ Combobox جدید در همان صفحه باز می‌شود و برای بیش از ۶ گزینه جستجو هم دارد |
| بعد از Products | دکمه حذف به لیست محصولات اضافه شد | اشتباه/فراموشی در تحویل قبلی — API حذف (Soft Delete) از قبل آماده بود ولی دکمه UI نداشت |

## 14. Known Issues

- اگر بعد از `claimFirstAdminSlot()` ساخت User شکست بخورد، پرچم
  قفل‌شده باقی می‌ماند و هیچ کاربری دیگر Super Admin نمی‌شود (نیاز به
  رفع دستی در دیتابیس). حالت بسیار نادر، برای سادگی فعلاً پذیرفته شده.
- تست End-to-End واقعی (OTP/SMS/DB) هرگز از داخل Sandbox Claude قابل
  اجرا نیست (بدون دسترسی شبکه به MongoDB Atlas/sms.ir/Vercel API) —
  همیشه باید توسط کاربر روی Vercel Preview/Production تست شود.

## 15. TODO (نزدیک)

- [ ] تست واقعی Products روی Vercel (آپلود تصویر واقعی به Cloudinary،
  ساخت/ویرایش محصول با Variant واقعی)
- [ ] شروع Feature Orders: مدل Order (Customer, Products, Variants,
  Quantity, Pricing, Shipping, Payment, Status)، صفحه لیست/جزئیات
  سفارش در Dashboard

## 16. Do Not Change (بدون دلیل قوی)

- فرمت پاسخ API (`apiSuccess`/`apiError`)
- Design Tokens پایه (رنگ Primary، Radius)
- ایمیل Commit Author باید همیشه `persboy.dev@gmail.com` باشد (باید با
  ایمیل حساب GitHub مطابقت داشته باشد، وگرنه Vercel Deployment را با
  خطای "Fix Git Configuration" مسدود می‌کند)
- استفاده از `src/proxy.ts` (نه `middleware.ts`)
- محدودیت عمق ۲ سطح Category — اگر تغییر کند، هم UI هم
  `category-depth.ts` هم Products (چون به Category وابسته است) باید
  هماهنگ به‌روز شوند
- منبع محاسبه قیمت نهایی فقط `computeFinalPrice()` در
  `src/lib/utils/pricing.ts` — هرگز این فرمول را در جای دیگری (مثلاً
  مستقیم در JSX) تکرار نکن، چون بعداً ناهماهنگ می‌شود

## 17. Environment Variables

نام کامل در `.env.example`. خلاصه:
`MONGODB_URI`, `AUTH_SECRET`, `OTP_HASH_SECRET`, `CLOUDINARY_CLOUD_NAME`,
`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `SMS_IR_API_KEY`,
`SMS_IR_LINE_NUMBER`, `SMS_IR_OTP_TEMPLATE_ID` (=963650)،
`NEXT_PUBLIC_APP_URL` (اختیاری — خودکار از VERCEL_URL)، `NODE_ENV`.

`SMS_IR_LINE_NUMBER` فعلاً فقط برای استفاده احتمالی آینده از متد Bulk
نگه داشته شده؛ OTP از آن استفاده نمی‌کند. هیچ مقدار واقعی Secret هرگز
نباید Commit شود (`.gitignore` با الگوی `.env*` + استثنای فایل‌های
`*.example`).

## 18. Deployment Notes

- Vercel مستقیماً به `mohamadpersboy/cms` (branch `main`) وصل است.
  کاربر Environment Variableها را مستقیماً در Vercel Dashboard تعریف
  کرده (کامل تا این مرحله).
- `scripts/vercel-env-sync.sh`: ابزار کمکی برای Bulk-sync کردن
  Environment Variables با Vercel CLI (در صورت نیاز آینده به تغییر
  دسته‌جمعی مقادیر). کاربر فعلاً از این استفاده نکرد و دستی وارد کرد.
  Claude نمی‌تواند این را خودش اجرا کند (Sandbox Claude به
  `api.vercel.com` دسترسی شبکه ندارد).
- `next.config.ts` هنوز پیش‌فرض است — تنظیمات Image Domains برای
  Cloudinary باید موقع Feature Products اضافه شود.
