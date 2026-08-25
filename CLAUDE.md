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

**آخرین کار:** تکمیل Feature «Discounts + Amazing Offers» — مدل مستقل
`AmazingOffer` با startAt/endAt، محاسبه وضعیت (فعال/زمان‌بندی‌شده/
منقضی/متوقف‌شده) کاملاً در Backend، صفحه مدیریت با Countdown، و صفحه
نمای کلی Discounts (خواندنی، لینک به فرم ویرایش محصول برای تغییر واقعی)
**Branch فعلی:** `main`
**Feature بعدی:** Customers

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
- ✅ Colors (زیرمجموعه Settings): مدل مستقل Color (نام + کد Hex)،
  مدیریت کامل در `/dashboard/settings/colors`، انتخاب رنگ در هر
  Variant محصول (حداکثر یک رنگ در هر Variant، با نمایش دایره رنگی
  واقعی نه فقط متن)
- ✅ `Combobox` سفارشی جایگزین `<select>` بومی HTML شد در کل پروژه
- ✅ ابزار `scripts/vercel-env-sync.sh` برای تنظیم یکجای Environment
  Variables (کاربر دستی استفاده کرد، فعلاً نیازی به اجرای مجدد نیست)
- ✅ رفع باگ: کلیک بیرون پاپ‌اپ خروج از حساب حالا آن را می‌بندد؛ مدت
  Session به ۹۰ روز افزایش یافت
- ✅ Orders Management: مدل کامل با Snapshot محصول/قیمت در زمان سفارش
  (تغییر بعدی قیمت محصول، سفارش‌های قبلی را دستکاری نمی‌کند)، State
  Machine وضعیت سفارش (Transitionهای مجاز اعتبارسنجی می‌شوند، نه هر
  تغییری)، ۳ حالت پرداخت (آنلاین/نقدی/ترکیبی با محاسبه خودکار
  پیش‌پرداخت سمت Server)، کسر/بازگردانی خودکار موجودی، ساخت سفارش
  دستی توسط کارمند/ادمین (چون Storefront/Checkout واقعی هنوز ساخته
  نشده) با جستجوی محصول زنده و Find-or-Create مشتری بر اساس شماره
  موبایل
- ✅ Discounts + Amazing Offers: مدل مستقل `AmazingOffer` (بدون Snapshot
  — همیشه از قیمت/عنوان زنده محصول می‌خواند، چون یک Overlay تبلیغاتی
  زنده است نه رکورد مالی مثل Order)، وضعیت (فعال/زمان‌بندی‌شده/منقضی/
  متوقف‌شده) کاملاً از Backend محاسبه می‌شود، جلوگیری از Offer همپوشان
  روی یک Variant، صفحه مدیریت با فیلتر وضعیت و Countdown سمت Client
  (فقط UX، منبع حقیقت Backend است)؛ صفحه `/dashboard/discounts` به‌عنوان
  نمای کلی خواندنی محصولات تخفیف‌دار (خودِ ویرایش تخفیف همچنان در فرم
  محصول انجام می‌شود تا دو منبع حقیقت برای یک داده ساخته نشود)

## 4. In Progress

هیچ‌کدام — منتظر شروع Customers.

## 5. Planned (به ترتیب)

1. **Customers** (بعدی — نمای مدیریتی جدا از Users، تمرکز روی
   مشتریان — احتمالاً بخش زیادی از UI لیست از همان الگوی Users قابل
   استفاده مجدد است)
2. Payment (مدل مستقل Payment طبق بند ۳۱ — انتخاب Gateway واقعی هنوز
   باقی مانده)
3. بعد از تکمیل کامل Dashboard: شروع Storefront (Home, Products,
   Category, Product Detail, Search, Cart, Checkout, Account, ...) —
   وقتی Storefront ساخته شد، Checkout واقعی باید به همین مدل Order و
   منطق موجود در `src/app/api/v1/orders/route.ts` وصل شود (نه بازنویسی)

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
      settings/  page.tsx + colors/page.tsx
      orders/  page.tsx + new/ + [id]/page.tsx + loading.tsx + error.tsx
      discounts/  page.tsx
      amazing-offers/  page.tsx + new/ + [id]/edit/
    (storefront)/              - هنوز خالی
    api/v1/
      auth/  otp/{request,verify}/route.ts, logout/route.ts
      users/  route.ts + [id]/route.ts + [id]/role/route.ts + [id]/status/route.ts
      categories/  route.ts + [id]/route.ts
      products/  route.ts + [id]/route.ts
      colors/  route.ts + [id]/route.ts
      orders/  route.ts + [id]/route.ts + [id]/status/route.ts
      amazing-offers/  route.ts + [id]/route.ts
      customers/find-or-create/route.ts
      uploads/sign/route.ts
    login/page.tsx
    layout.tsx, page.tsx, globals.css
  components/
    ui/         - Button, Card, Badge, Input, Textarea, Combobox, Table,
                  Pagination, Skeleton, EmptyState, ErrorState, ConfirmDialog
    dashboard/  - DashboardShell, KpiCard, charts, ...
    users/      - RoleBadge, UserStatusBadge, users-page-client, ...
    categories/ - CategoriesTree, CategoryForm
    products/   - ProductForm, ProductImageUploader, ImageCropModal,
                  VariantEditor, TechnicalSpecsEditor, ProductStatusBadge,
                  products-page-client
    settings/   - ColorsManager, ColorFormModal
    orders/     - OrderForm, OrderItemsPicker, OrderDetailCard,
                  OrderStatusBadge, orders-page-client
    amazing-offers/ - AmazingOfferForm, AmazingOfferStatusBadge,
                  AmazingOfferCountdown, amazing-offers-page-client
    discounts/  - discounts-page-client (فقط خواندنی)
    auth/       - OtpLoginForm
  config/env.ts
  fonts/index.ts
  lib/
    auth/       session.ts, otp.ts, current-user.ts, api-guard.ts
    cloudinary/ config.ts (server-only — signed uploads, secret never in client)
    db/         connect.ts
    constants/  rbac.ts, dashboard-nav.ts
    sms/        send-otp-sms.ts, send-order-status-sms.ts
    utils/      api-response.ts, cn.ts, format.ts, slugify.ts,
                pricing.ts, image-crop.ts, amazing-offer.ts
    validations/ auth.ts, users.ts, categories.ts, category-depth.ts, products.ts,
                amazing-offers.ts
    mock/       dashboard.ts (فقط همین باقی مانده Mock)
  models/       User.ts, Otp.ts, SystemFlag.ts, Category.ts, Product.ts,
                Color.ts, Order.ts, Counter.ts, AmazingOffer.ts
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

### Color
`name` (unique)، `hexCode` (`#RRGGBB`، Uppercase)، `isActive`،
`sortOrder`، timestamps. مستقل از Product — هر Variant حداکثر یک
`colorId` می‌تواند داشته باشد (نه بیشتر؛ تصمیم آگاهانه چون هر Variant
معادل یک SKU مشخص است). حذف رنگی که روی حداقل یک محصول استفاده شده،
مسدود می‌شود (نه Cascade) تا Variant بدون رنگ باقی نماند.

### Product
`title`, `slug` (unique)، `description?`, `technicalDescription?`,
`technicalSpecifications: {key,value}[]` (کاملاً Flexible، Hard-code
نشده)، `category` (ref Category, required)، `images: {url,publicId}[]`
(حداکثر ۱۰، از Cloudinary)، `variants` (حداقل ۱، هرکدام: `unit`
[تخته/عدد/جفت/متر/متر مربع]، `colorId?` [ref Color، حداکثر یکی]،
`attributes: {name,value}[]` [اندازه/شانه/تراکم/... — رنگ دیگر اینجا
نیست، فیلد اختصاصی خودش را دارد]، `sku?`، `price`، `discountPercent`،
`discountAmount`، `stock`، `isActive`)، `status` (draft/published/
archived)، `seo` (title?/description?)، `deletedAt` (Soft Delete)،
timestamps.

قیمت نهایی هر Variant با `computeFinalPrice()` در
`src/lib/utils/pricing.ts` محاسبه می‌شود (درصد و مبلغ ثابت هردو
پشتیبانی می‌شوند) — این تابع منبع واحد محاسبه قیمت در کل پروژه است،
هم API هم UI از همین استفاده می‌کنند.

### Order
`orderNumber` (عدد صحیح یکتا، تولیدشده Atomic از `Counter`، شروع از
۱۰۰۰۱)، `customer` (ref User)، `items[]` (هرکدام **Snapshot کامل**
لحظه سفارش: عنوان، واحد، نام رنگ، ویژگی‌ها، قیمت واحد نهایی، تعداد،
جمع — نه فقط رفرنس، چون تغییر بعدی قیمت/محصول نباید سفارش‌های قبلی را
دستکاری کند)، `shippingAddress` (Embedded: گیرنده/موبایل/استان/شهر/
آدرس/کدپستی)، `subtotal`، `shippingCost`، `totalAmount`،
`paymentMethod` (online/cash/split)، `prepaymentPercent/Amount`،
`remainingAmount` (محاسبه‌شده توسط `computePrepayment()` در
`pricing.ts` — کاربر هرگز مستقیماً مبلغ را وارد نمی‌کند، فقط درصد را
برای حالت split)، `status` (State Machine، بخش زیر)، `statusHistory[]`
(هر رکورد: وضعیت، زمان، `changedBy` [ref User]، `note?` اختیاری — یک
رکورد اولیه با وضعیت `pending` موقع ساخت سفارش هم ثبت می‌شود)، `notes`
(یادداشت کلی سفارش، مجزا از یادداشت هر تغییر وضعیت)، timestamps.

**Order Status State Machine** (`src/lib/constants/order-status.ts`):
`pending → confirmed → processing → ready_to_ship → shipped →
delivered`، با `cancelled` مجاز از هر مرحله قبل از ارسال، و `returned`
فقط بعد از `shipped`/`delivered`. `cancelled`/`returned` نهایی
هستند. تمام تغییرات وضعیت (چه از UI چه مستقیم API) از
`canTransitionOrderStatus()` عبور می‌کنند — این تابع منبع حقیقت
انتقال وضعیت است، هم UI (کدام گزینه‌ها را نشان بدهد) هم API (کدام
تغییر واقعاً مجاز است) از همین استفاده می‌کنند. لغو/مرجوعی موجودی
Variant را خودکار برمی‌گرداند.

**اطلاع‌رسانی پیامکی تغییر وضعیت:** `src/lib/sms/send-order-status-sms.ts`
با متد **Bulk** sms.ir (نه Pattern/Verify مثل OTP، چون این پیام‌ها
اطلاع‌رسانی عمومی‌اند نه کد تأیید حساس زمان و نیازی به Template
تأییدشده ندارند) در هر تغییر وضعیت (هم ساخت سفارش هم هر Transition
بعدی) برای مشتری ارسال می‌شود. **Best-effort:** اگر ارسال پیامک شکست
بخورد، فقط در Log ثبت می‌شود و درخواست اصلی (ساخت سفارش/تغییر وضعیت)
هرگز به همین دلیل Fail نمی‌شود.

### Counter
`key` (unique)، `value`. Helper عمومی `getNextSequence(key)` برای
شماره‌گذاری اتمیک (فعلاً فقط `orderNumber` از آن استفاده می‌کند).

### AmazingOffer
`productId` (ref Product)، `variantId` (ObjectId — منطبق بر `_id`
داخل `Product.variants`، نه یک Ref مستقل چون Variant زیرسند است نه
Collection جدا)، `discountType` (`percent` | `fixed`)، `discountValue`،
`startAt`، `endAt` (بند ۲۵)، `isActive` (سوییچ دستی ادمین برای توقف/
لغو Offer، **مستقل** از زمان‌بندی — یعنی وضعیت نهایی همیشه ترکیب هر دو
است، نه فقط یکی)، timestamps. بدون Snapshot از عنوان/قیمت محصول —
برخلاف `Order.items[]`، این یک Overlay تبلیغاتی زنده است و باید همیشه
از محصول واقعی بخواند، نه یک رکورد مالی که نباید عوض شود.

`getAmazingOfferStatus()` در `src/lib/utils/amazing-offer.ts` تنها
مرجع محاسبه وضعیت (`scheduled`/`active`/`expired`/`paused`) است — هم
API هم UI از همین استفاده می‌کنند (بند ۲۶: «Countdown فقط برای UX است
و منبع حقیقت باید Backend باشد»). هنگام ساخت Offer جدید، اگر Variant
موردنظر از قبل یک Offer فعال/زمان‌بندی‌شده منقضی‌نشده داشته باشد، ساخت
مسدود می‌شود (۴۰۹) تا دو تخفیف شگفت‌انگیز همزمان روی یک Variant نباشد.

**Planned models:** Payment (مستقل، طبق بند ۳۱)، Address (Address
فعلاً به‌صورت Embedded داخل Order است؛ Address Book مستقل مشتری بخشی
از Storefront/Account است).

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
| Colors | یک Model مستقل `Color` (نه بخشی از Category/Product) | رنگ یک مفهوم مستقل با ساختار خودش (نام+Hex) است که در آینده هم فقط به Variant محدود نمی‌ماند |
| Colors | هر Variant حداکثر **یک** `colorId` (نه آرایه) | هر Variant معادل یک SKU/ترکیب مشخص است؛ چند رنگ روی یک Variant یعنی موجودی/قیمت معلوم نیست مال کدام رنگ است — برای رنگ‌های مختلف باید Variant جدا ساخت |
| Colors | حذف رنگِ درحال‌استفاده مسدود می‌شود (نه Cascade روی Variantها) | حذف خاموش رنگ از Variantهای موجود می‌توانست داده گمراه‌کننده (Variant بدون رنگ که قبلاً رنگ داشت) بسازد |
| Colors | صفحه مدیریت زیرمجموعه Settings (`/dashboard/settings/colors`) | درخواست صریح کاربر؛ Settings هم برای اولین‌بار در این مرحله فعال شد |
| Orders | سفارش دستی از Dashboard (نه Checkout واقعی) | چون Storefront/Checkout هنوز ساخته نشده؛ فروشگاه فرش عملاً سفارش تلفنی هم زیاد دارد، پس این UI به‌خودی‌خود مفید است، نه صرفاً Placeholder |
| Orders | هر Item سفارش یک Snapshot کامل است (نه فقط productId/variantId) | اگر بعداً قیمت یا عنوان محصول عوض شود، سفارش‌های ثبت‌شده قبلی نباید تغییر کنند — تاریخچه مالی باید Immutable باشد |
| Orders | Payment مستقل (بند ۳۱) هنوز ساخته نشده؛ فعلاً فیلدهای پرداخت مستقیم روی Order هستند | چون Gateway واقعی هنوز انتخاب نشده (تصمیم Bootstrap)؛ وقتی انتخاب شد، Payment از Order جدا می‌شود بدون Breaking Change در Schema فعلی (فیلدهای فعلی به‌عنوان Snapshot باقی می‌مانند) |
| Orders | State Machine وضعیت با یک Map انتقال مجاز (`order-status.ts`)، نه enum ساده با هر تغییر آزاد | جلوگیری از پرش وضعیت غیرمنطقی (مثلاً pending مستقیم به delivered)؛ الگو مشابه `category-depth.ts`: تابع مستقل، قابل تست، هم در UI هم API استفاده می‌شود |
| Orders | لغو/مرجوعی سفارش، موجودی Variant را خودکار برمی‌گرداند | جلوگیری از قفل‌شدن دائمی موجودی روی سفارش‌های لغوشده |
| بعد از Orders | یک Table primitive مشترک (`src/components/ui/table.tsx`) ساخته و همه ۶ جدول پروژه با آن بازنویسی شد | باگ گزارش‌شده: Header با Center پیش‌فرض مرورگر (`th`) نمایش داده می‌شد ولی `td` از تراز RTL ارث می‌برد (راست) — ناهماهنگ؛ به‌جای اصلاح تک‌تک، یک Component مشترک ساخته شد تا جدول‌های بعدی هم خودکار هماهنگ بمانند |
| بعد از Orders | آدرس ارسال به فرمت برچسب‌دار (تحویل‌گیرنده/شماره تماس/استان+شهر/آدرس/کدپستی) تغییر کرد؛ `dir="ltr"` از نمایش شماره تلفن‌ها (نه Inputها) حذف شد | خوانایی بهتر + رفع باگ گزارش‌شده: `dir="ltr"` روی یک `<p>` تمام‌عرض باعث می‌شد کل خط به چپ بچسبد؛ اعداد لاتین داخل متن RTL بدون نیاز به override جهت درست نمایش داده می‌شوند (رفتار استاندارد Bidi) |
| بعد از Orders | تاریخچه کامل تغییر وضعیت سفارش (`statusHistory[]`) + یادداشت اختیاری هر تغییر + پیامک اطلاع‌رسانی خودکار (Bulk، نه Pattern) | درخواست صریح کاربر؛ هر سه با هم اضافه شدند تا معلق نماند |
| بعد از Orders | پیامک وضعیت سفارش Best-effort است (خطای ارسال، درخواست اصلی را Fail نمی‌کند) | یک مشکل موقت sms.ir نباید مانع ثبت/تغییر وضعیت سفارش واقعی در دیتابیس شود |
| بعد از Colors | مدت Session از ۳۰ به ۹۰ روز افزایش یافت | درخواست کاربر برای کاهش دفعات Login با هزینه پیامک — هرچند علت اصلی شکایت احتمالاً تعویض Domain بین Deploymentهای مختلف Vercel است، نه انقضای Session (مستند در Known Issues) |
| بعد از Colors | کلیک بیرون از پاپ‌اپ خروج (User Menu) حالا آن را می‌بندد | باگ گزارش‌شده توسط کاربر — Combobox از اول این رفتار را داشت ولی User Menu نداشت؛ رفع با همان الگوی Click-Outside |
| Amazing Offers | مدل `AmazingOffer` مستقل بدون Snapshot از محصول | برخلاف Order، این یک Overlay تبلیغاتی زنده است؛ باید همیشه قیمت/عنوان فعلی محصول را نشان دهد نه لحظه ساخت |
| Amazing Offers | `variantId` بدون Ref مستقل (فقط ObjectId ساده) | Variant یک زیرسند داخل `Product.variants` است، نه یک Collection جدا؛ تطبیق با جستجوی دستی درون آرایه Variantها (همان الگوی `colorId` روی Variant) |
| Amazing Offers | وضعیت (فعال/زمان‌بندی‌شده/منقضی/متوقف‌شده) هرگز در DB ذخیره نمی‌شود، همیشه محاسبه‌شده از `isActive` + `startAt`/`endAt` | بند ۲۵: «از ذخیره کردن وضعیت‌های محاسباتی به شکل ناسازگار خودداری کن»؛ الگو مشابه `canTransitionOrderStatus` — یک Helper مستقل، هم API هم UI از همان استفاده می‌کنند |
| Amazing Offers | ساخت Offer جدید روی Variantی که از قبل Offer فعال/زمان‌بندی‌شده دارد مسدود می‌شود | جلوگیری از دو تخفیف شگفت‌انگیز همپوشان روی یک Variant که قیمت نهایی را مبهم می‌کرد |
| Discounts | صفحه `/dashboard/discounts` فقط خواندنی است؛ ویرایش واقعی تخفیف در فرم محصول (سطح Variant) باقی می‌ماند | آن فیلدها (`discountPercent`/`discountAmount`) از قبل در Products ساخته شده بودند؛ ساخت مسیر نوشتن دوم برای همان داده، دو منبع حقیقت می‌ساخت |

## 14. Known Issues

- اگر بعد از `claimFirstAdminSlot()` ساخت User شکست بخورد، پرچم
  قفل‌شده باقی می‌ماند و هیچ کاربری دیگر Super Admin نمی‌شود (نیاز به
  رفع دستی در دیتابیس). حالت بسیار نادر، برای سادگی فعلاً پذیرفته شده.
- تست End-to-End واقعی (OTP/SMS/DB) هرگز از داخل Sandbox Claude قابل
  اجرا نیست (بدون دسترسی شبکه به MongoDB Atlas/sms.ir/Vercel API) —
  همیشه باید توسط کاربر روی Vercel Preview/Production تست شود.
- **مهم — عدم تطابق احتمالی MONGODB_URI بین محیط‌های Vercel:** اگه
  کاربری که قبلاً Super Admin شده بود، دوباره Login کرد و این‌بار نقشش
  `customer` بود (و در نتیجه Dashboard او را به `/` هدایت کرد)، علتش
  این نیست که کد اشتباه کار می‌کند — یعنی این حساب در یک دیتابیس
  *متفاوت* (یا خالی) ثبت‌نام شده، چون منطق «اولین کاربر = Super Admin»
  در سطح کل یک دیتابیس فقط یک‌بار اتفاق می‌افتد. باید `MONGODB_URI` در
  هر ۳ محیط Vercel (Production/Preview/Development) بررسی و یکسان‌سازی
  شود؛ رفع فوری: در MongoDB Atlas مستقیماً فیلد `role` کاربر مربوطه در
  Collection `users` را به `super_admin` تغییر بده.
- **علت شایع «هر بار باید Login کنم»:** معمولاً به مدت‌زمان Session
  ربطی ندارد (که الان ۹۰ روز است) بلکه به این دلیل است که هر
  Deployment جدید روی Vercel یک URL منحصربه‌فرد دارد و Cookie بین
  Domainهای متفاوت به اشتراک گذاشته نمی‌شود؛ باید همیشه از آدرس ثابت
  Production (نه لینک هر Deployment) استفاده شود.

## 15. TODO (نزدیک)

- [ ] تست واقعی Orders روی Vercel (ساخت سفارش دستی، جستجوی محصول
  زنده، تغییر وضعیت با State Machine، بررسی کسر/بازگردانی موجودی،
  دریافت واقعی پیامک اطلاع‌رسانی تغییر وضعیت)
- [ ] تست واقعی Discounts + Amazing Offers روی Vercel (ساخت Offer،
  بررسی Countdown، انقضای خودکار بعد از `endAt`، جلوگیری از Offer
  همپوشان، نمای `/dashboard/discounts`)
- [ ] شروع Feature بعدی: Customers

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
