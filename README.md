# فرش سقطچی — فروشگاه اینترنتی تخصصی فرش

فروشگاه اینترنتی تخصصی محصولات فرش (فرش ماشینی، موکت، تابلو فرش، پادری،
قالیچه و ...) برای بازار ایران. RTL و کاملا فارسی.

> **وضعیت فعلی:** Dashboard (پنل مدیریت) عملاً کامل است — Auth، RBAC،
> محصولات/Variant، سفارش‌ها، تخفیف/کوپن/شگفت‌انگیز، شبکه‌های اجتماعی،
> استان/شهر، آدرس+نقشه نشان، Cart، و Wallet (نسخه ساده) پیاده‌سازی
> شده‌اند. Storefront (فروشگاه عمومی) هنوز در مراحل اولیه است — فقط
> ۴ API عمومی محصول ساخته شده، هنوز صفحه‌ای برای نمایش آن‌ها نیست.
> جزئیات کامل وضعیت در [`CLAUDE.md`](./CLAUDE.md) و مستندات API در
> [`docs/API.md`](./docs/API.md) نگه‌داری می‌شود.

## Features

فهرست کامل در `CLAUDE.md` بخش «Completed Features» است. خلاصه:
Dashboard کامل (Auth با OTP، RBAC، Users، Categories، Products+Variants،
Orders، Discounts/Coupons/Amazing Offers، Social Links، Provinces/Cities،
Neshan Maps، Cart، Wallet ساده)، به‌علاوه ۴ API عمومی Storefront برای
محصولات (`latest`, `best-selling`, `best-discounts`, `amazing-offers`).

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB + Mongoose + mongoose-paginate-v2
- **Auth:** Mobile Number + OTP (Session سفارشی با `jose`)
- **Image Management:** Cloudinary
- **SMS:** sms.ir
- **Maps:** Neshan (`@neshan-maps-platform/leaflet`) — نقشه + Reverse Geocoding
- **Excel Import:** `xlsx` (استان/شهر)
- **Font:** IRANYekanX Pro

جزئیات کامل نسخه‌ها در `CLAUDE.md` بخش «Tech Stack».

## Installation

```bash
git clone https://github.com/mohamadpersboy/cms.git
cd cms
npm install
cp .env.example .env.local
# مقادیر واقعی را در .env.local پر کنید
```

## Environment Variables

به `.env.example` مراجعه کنید. خلاصه متغیرهای مورد نیاز:

| متغیر | توضیح |
|---|---|
| `MONGODB_URI` | Connection String دیتابیس MongoDB |
| `AUTH_SECRET` | رشته تصادفی ۳۲+ کاراکتری برای امضای JWT جلسه |
| `OTP_HASH_SECRET` | رشته تصادفی جدا برای Hash کردن کدهای OTP |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | اطلاعات Cloudinary |
| `SMS_IR_API_KEY` / `SMS_IR_LINE_NUMBER` / `SMS_IR_OTP_TEMPLATE_ID` | اطلاعات sms.ir برای ارسال OTP |
| `NEXT_PUBLIC_NESHAN_API_KEY` | Key نقشه نشان — Client-side، امنیت با محدودیت Domain در پنل Neshan |
| `NEXT_PUBLIC_APP_URL` | آدرس عمومی اپلیکیشن (اختیاری — به‌طور خودکار از `VERCEL_URL` ساخته می‌شود) |

### تنظیم یکجای همه‌ی Environment Variableها روی Vercel

به‌جای وارد کردن دستی هر متغیر در Vercel Dashboard، می‌توانید همه را
یکجا با اسکریپت زیر ثبت کنید (روی هر سه محیط Production/Preview/
Development):

```bash
npm i -g vercel        # اگر نصب نیست
vercel login
cp .env.vercel.local.example .env.vercel.local
# مقادیر واقعی را در .env.vercel.local پر کنید (این فایل هرگز Commit نمی‌شود)
bash scripts/vercel-env-sync.sh
```

بعد از تغییر یک مقدار، کافیست دوباره همین دستور را اجرا کنید — مقادیر
موجود Overwrite می‌شوند. توجه: Vercel مقادیر جدید را فقط روی
Deploymentهای *بعد از* تغییر اعمال می‌کند، نه Deployment فعلی.

## Development

```bash
npm run dev         # اجرای سرور توسعه
npm run lint         # بررسی ESLint
npm run typecheck    # بررسی TypeScript
npm run format        # فرمت‌دهی با Prettier
```

## Build

```bash
npm run build
npm run start
```

## Testing

```bash
npx vitest run
```

تست‌ها Unit Test روی توابع خالص (قیمت‌گذاری، Cart، Discount، Wallet،
Validation) و Zod Schema ها هستند — بدون زیرساخت Integration/API Test
واقعی (بدون DB واقعی در تست). قبل از هر Commit باید Typecheck، ESLint،
تست کامل، و Build همگی موفق باشند (بدون استثنا).

## API Documentation

مستندات کامل APIهای Social Links، Province/City، Neshan، Cart، و
Wallet در [`docs/API.md`](./docs/API.md). برای APIهای قدیمی‌تر
(Auth، Products، Orders، ...) به کد منبع مراجعه کنید.

## Project Structure

ساختار کامل پوشه‌ها در `CLAUDE.md` بخش «Folder Structure» مستند شده.

## Database

MongoDB با Mongoose. مدل‌های فعلی در `CLAUDE.md` بخش «Database Models»
فهرست شده‌اند (User، Product، Order، Cart، Wallet، Province/City،
SocialLinks، و ...).

## Authentication

ورود با شماره موبایل + کد یک‌بارمصرف (OTP) از طریق sms.ir. همین Flow
برای هم Staff (Dashboard) و هم Customer استفاده می‌شود — کاربر جدید با
نقش `customer` ساخته می‌شود مگر اولین کاربر سیستم باشد (که
`super_admin` می‌شود). جزئیات کامل در `CLAUDE.md` بخش «Architecture».

## Git Workflow

طبق تصمیم صریح کارفرما، همه تغییرات مستقیماً روی `main` Commit/Push
می‌شوند (بدون Feature Branch جدا). قبل از هر Push: Typecheck، ESLint،
تست، و Build باید همه موفق باشند. جزئیات کامل در `CLAUDE.md` بخش
«Git Workflow».

## Current Status

Dashboard کامل + زیرساخت پیش‌نیاز Storefront (Social Links،
Province/City، Neshan Maps، Cart، Wallet ساده، ۴ API عمومی محصول)
تکمیل شده. مرحله بعدی: توسعه واقعی صفحات Storefront. برای وضعیت دقیق و
به‌روز همیشه به [`CLAUDE.md`](./CLAUDE.md) مراجعه کنید.

