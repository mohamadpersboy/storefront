# کارت‌من — فروشگاه اینترنتی تخصصی فرش

فروشگاه اینترنتی تخصصی محصولات فرش (فرش ماشینی، موکت، تابلو فرش، پادری،
قالیچه و ...) برای بازار ایران. RTL و کاملا فارسی.

> **وضعیت فعلی:** پروژه تازه Bootstrap شده است. هنوز هیچ Feature UI/Backend
> واقعی (Dashboard، Auth، محصولات و ...) پیاده‌سازی نشده. جزئیات کامل وضعیت
> در [`CLAUDE.md`](./CLAUDE.md) نگه‌داری می‌شود.

## Features

فعلا فقط اسکلت پروژه آماده است. لیست کامل Featureهای برنامه‌ریزی‌شده در
`CLAUDE.md` بخش «Planned» موجود است.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB + Mongoose + mongoose-paginate-v2
- **Auth:** Mobile Number + OTP (Session سفارشی با `jose`)
- **Image Management:** Cloudinary (نصب شده، هنوز Wire نشده)
- **SMS:** sms.ir (نصب شده، هنوز Wire نشده)
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
| `SMS_IR_API_KEY` / `SMS_IR_LINE_NUMBER` | اطلاعات sms.ir برای ارسال OTP |
| `NEXT_PUBLIC_APP_URL` | آدرس عمومی اپلیکیشن |

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

هنوز Test نوشته نشده — طبق Workflow پروژه، تست‌ها همراه هر Feature
اضافه می‌شوند (به `CLAUDE.md` مراجعه کنید).

## Project Structure

ساختار کامل پوشه‌ها در `CLAUDE.md` بخش «Folder Structure» مستند شده.

## Database

MongoDB با Mongoose. مدل‌های فعلی: `User`، `Otp`. مدل‌های برنامه‌ریزی‌شده
(Category، Product، Variant، Order، Payment و ...) در `CLAUDE.md`
بخش «Database Models» فهرست شده‌اند.

## Authentication

ورود با شماره موبایل + کد یک‌بارمصرف (OTP) از طریق sms.ir. جزئیات کامل
Flow در `CLAUDE.md` بخش «Architecture».

## Git Workflow

هر Feature ابتدا در دو Branch جدا (`feature/ui` و `feature/backend`)
توسعه داده می‌شود و فقط پس از تأیید صریح کاربر به `main` Merge می‌شود.
جزئیات کامل در `CLAUDE.md` بخش «Git Workflow».

## Current Status

Initial Project Setup — تکمیل شده. برای وضعیت دقیق و به‌روز همیشه به
[`CLAUDE.md`](./CLAUDE.md) مراجعه کنید.
