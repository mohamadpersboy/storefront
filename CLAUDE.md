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

**آخرین کار:** کاربر یک Master Workflow جدید برای توسعه Storefront
ارائه کرد («Storefront Development Workflow») که ترتیب Phaseهای
Homepage را نسبت به لیست قبلی (بخش ۵) تغییر می‌دهد — ترتیب جدید و
معتبر:

Phase 1: Mobile Bottom Bar → Phase 2: Desktop Header → Phase 3: Hero
Slider → Phase 4: Special Offers Carousel → Phase 5: Latest Products
Carousel → Phase 6: Most Discounted Carousel → Phase 7: Best Sellers
Carousel → Phase 8: سایر بخش‌ها (در صورت نیاز) → Phase 9: Footer.

این ترتیب جایگزین لیست قدیمی «Planned» (بخش ۵) می‌شود؛ لیست قدیمی
دیگر معتبر نیست (نگاه کنید بخش ۵ برای نسخه به‌روزشده).

**Phase 1 (Mobile Bottom Bar) انجام شد:**
- Route Group `(storefront)` دوباره ساخته شد (`layout.tsx` با کلاس
  `storefront` + `page.tsx` Placeholder موقت — فقط برای اینکه Route
  Group قابل build باشد؛ محتوای واقعی صفحه اصلی در Phaseهای بعدی
  اضافه می‌شود).
- Token های مستقل `--sf-*` (پالت navy/blue، تصمیم قبلاً تأییدشده)
  دوباره در `globals.css` داخل کلاس `.storefront` اضافه شدند —
  دقیقاً همان مقادیر قبلی، چون این تصمیم Discard نشده بود، فقط
  پیاده‌سازی‌اش حذف شده بود.
- `src/components/storefront/mobile-bottom-bar.tsx`: ۵ تب (خانه،
  دسته‌بندی‌ها، سبد خرید، علاقه‌مندی‌ها، حساب من)، فقط زیر `sm`
  نمایش داده می‌شود (`sm:hidden`)، `safe-area-inset-bottom` برای
  گوشی‌های دارای Notch، حالت Active بر اساس `usePathname`. بج سبد
  خرید فعلاً همیشه ۰ است (Cart واقعی نیاز به Login دارد و اتصال آن
  خارج از Scope همین ماژول است — طبق بند ۵۲ Master Prompt: صفر واقعی
  به‌جای عدد ساختگی).
- `src/app/page.tsx` قدیمی حذف و با `(storefront)/page.tsx` جایگزین
  شد (Next.js اجازه دو `page.tsx` هم‌مسیر در `/` را نمی‌دهد).
- تست‌ها: TypeScript ✅، ESLint ✅، Vitest (۲۷۷ تست) ✅، Build ✅.

**Branch فعلی:** `main`
**Feature بعدی:** Phase 2 (Desktop Header) — منتظر تأیید کاربر برای
ادامه (طبق قانون اصلی: بدون تأیید صریح، ماژول بعدی شروع نمی‌شود).

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
- ✅ Customers: نمای خواندنی مشتریان (role=customer) با جستجو،
  Pagination، تعداد سفارش و مجموع خرید (از Aggregation روی Order، نه
  فیلد ذخیره‌شده — همیشه به‌روز است)، صفحه جزئیات با تاریخچه سفارش‌های
  همان مشتری؛ تغییر نقش/فعال‌سازی حساب عمداً اینجا تکرار نشده و به
  صفحه Users که قبلاً همین قابلیت را دارد ارجاع داده می‌شود
- ✅ Payment: مدل مستقل `Payment` (طبق بند ۳۱ — جدا از `Order`، امکان
  چند تلاش پرداخت برای یک سفارش)، اتصال واقعی به زرین‌پال (API v4،
  `currency: "IRT"` چون کل پروژه با تومان کار می‌کند نه ریال)، آدرس
  Sandbox/Production کاملاً از `ZARINPAL_MODE` مشتق می‌شود (سوییچ بدون
  تغییر کد)، مسیر Callback عمومی (بدون نیاز به ورود — مرورگر مشتری،
  نه کارمند، به آن هدایت می‌شود) که مبلغ را همیشه از رکورد ذخیره‌شده
  Verify می‌کند نه از Query String قابل‌دستکاری، صفحه عمومی نتیجه
  پرداخت (`/payment/result`)، و پنل «پرداخت آنلاین» در صفحه جزئیات
  سفارش برای ساخت/کپی لینک پرداخت توسط کارمند (چون Checkout واقعی
  Storefront هنوز نیست). موفقیت پرداخت عمداً وضعیت سفارش را خودکار
  تغییر نمی‌دهد — State Machine سفارش یک تصمیم آگاهانه ادمین می‌ماند
- ✅ Coupon / Discount Code System + Automatic Payment Reward (Master
  Prompt جدید بندهای ۲۵-۴۵): `Coupon` Entity مستقل (نه فیلد داخل
  Product/Order)، عمومی/خصوصی، سقف تخفیف، حداقل مبلغ سفارش، بازه
  زمانی، محدودیت تعداد کل و محدودیت هر کاربر؛ `CouponRedemption` برای
  ردیابی مصرف هر کاربر و جلوگیری از Race Condition (رزرو اتمیک
  `usedCount` با `findOneAndUpdate` + شرط `$expr`)؛ `DiscountSettings`
  Singleton برای تخفیف خودکار پرداخت آنلاین/ترکیبی؛ موتور محاسبه
  متمرکز `src/lib/discounts/engine.ts` (بند ۴۲) که Coupon و Payment
  Reward را طبق بند ۴۱ **متقابلاً منحصر به فرد** می‌کند (تصمیم صریح
  کاربر — جزئیات در بخش ۱۳)؛ اعتبارسنجی Coupon به‌صورت تابع خالص جدا
  از DB (`validate-coupon.ts`) برای تست‌پذیری کامل بند ۴۵؛ فرم ساخت
  سفارش کد تخفیف را زنده Preview می‌کند ولی Backend همیشه دوباره و
  مستقل محاسبه می‌کند (بند ۴۴)؛ Dashboard: `/dashboard/coupons` (لیست
  + فرم با انتخاب کاربران خصوصی از طریق Search) و
  `/dashboard/settings/discounts` (تنظیم پاداش پرداخت)
- ✅ تقویم شمسی برای Coupon + Coupon Code Generator: تاریخ شروع/انقضای
  Coupon با کتابخانه `jalaali-js` به‌طور کامل Jalali نمایش و دریافت
  می‌شود (`JalaliDatePicker` — سه Combobox روز/ماه/سال، بدون هیچ
  المان native `<input type=date>` که همیشه Gregorian است)؛ تبدیل
  به/از ISO با لنگر UTC نیمه‌شب (بدون درگیری Timezone). Code Generator
  (`generateCandidateCouponCode`, تابع خالص) با ترکیب چند Theme
  فرش‌محور و الگوی تصادفی کد پیشنهاد می‌دهد، سپس از طریق
  `/api/v1/coupons/check-code` در‌دسترس بودن را تأیید می‌کند تا کد
  تکراری پیشنهاد نشود؛ در فرم ساخت Coupon هم به‌صورت خودکار در بدو باز
  شدن فرم اجرا می‌شود هم با دکمه «پیشنهاد کد تخفیف» تکرارپذیر است
- ✅ تقویم شمسی برای Amazing Offer: `JalaliDateTimePicker`
  (`src/components/ui/jalali-datetime-picker.tsx`) با ۵ Combobox
  (روز/ماه/سال/ساعت/دقیقه) جایگزین `<input type="datetime-local">`
  شد. برخلاف `JalaliDatePicker` مخصوص Coupon (که لنگر UTC نیمه‌شب
  دارد چون فقط «روز» مهم است)، این یکی زمان محلی مرورگر را می‌خواند
  و می‌نویسد — چون این فیلدها لحظه دقیق شروع/پایان Countdown واقعی
  را تعیین می‌کنند، نه فقط یک روز تقویمی؛ `isoToJalaliDateTime()` /
  `jalaliDateTimeToIso()` در `src/lib/utils/jalali.ts` این تفاوت را
  از توابع Date-Only مجزا نگه می‌دارند تا با هم اشتباه گرفته نشوند
- ✅ Social Links (Settings): مدل Singleton `SocialLinks` با آرایه
  `links` (`platform`/`url`/`isActive`) — پلتفرم‌ها در ثابت
  `SOCIAL_PLATFORMS` (`src/models/SocialLinks.ts`) تعریف شده‌اند تا
  افزودن شبکه اجتماعی جدید در آینده فقط یک خط باشد، بدون تغییر
  Model/Route/UI. `getSocialLinks()` سند را Atomic می‌سازد (الگوی
  `getDiscountSettings`) و اگر پلتفرم جدیدی بعداً به لیست اضافه شود،
  خودکار با مقدار پیش‌فرض به سندهای قدیمی اضافه می‌کند (بدون Migration
  دستی). `GET /api/v1/social-links` عمداً **بدون Auth** است (اولین
  Route عمومی پروژه) چون هم Dashboard هم Storefront آینده به آن نیاز
  دارند و داده حساس نیست؛ `PATCH` با `SETTINGS_MANAGE` محافظت می‌شود.
  UI: `/dashboard/settings/social-links`.
- ✅ Province/City (بند ۳ سند Audit): مدل‌های `Province`
  (`name`+`code` یکتا) و `City` (`name`+`code` یکتا+`province` Ref،
  Index روی `{province, name}`). Import از Excel با معماری دو-لایه‌ی
  عمداً جدا:
  - `validate-province-city-rows.ts` — تابع **خالص** (بدون DB/فایل)
    که ستون‌های `Province`/`Province Code`/`City`/`City Code` را
    Validate می‌کند، تشخیص Duplicate کد می‌دهد و شماره سطر واقعی Excel
    را گزارش می‌کند؛ کاملاً قابل Unit Test (۶ تست).
  - `parse-excel.ts` — فقط I/O (خواندن Buffer با کتابخانه `xlsx`).
  - `import-provinces-cities.ts` — Upsert در Mongo؛ ابتدا با
    `session.withTransaction` تلاش می‌کند (روی Atlas/Replica Set کار
    می‌کند)، و اگر Deployment از Transaction پشتیبانی نکند (مثلاً
    Mongo Standalone محلی)، به‌صورت Best-effort غیر-Transactional
    Fallback می‌کند و این را در پاسخ API (`transactional: false`)
    گزارش می‌دهد.
  - `POST /api/v1/provinces/import` (`LOCATIONS_MANAGE`, multipart
    file)، `GET /api/v1/provinces` و `GET /api/v1/cities?province=`
    هر دو **بدون Auth** (عمومی، مثل social-links) چون فرم‌های Address
    آینده در Storefront هم به آن‌ها نیاز دارند.
  - RBAC: پرمیشن‌های جدید `LOCATIONS_READ` (Staff+) و
    `LOCATIONS_MANAGE` (Admin+) اضافه شدند.
  - UI: `/dashboard/settings/provinces-cities` (آپلود Excel + فهرست
    استان‌ها).
  - ⚠️ TODO یادداشت‌شده: فرم آدرس فعلی `Order.shippingAddress`
    همچنان `province`/`city` را به‌صورت Free-text ذخیره می‌کند (تغییر
    ندادم چون خارج از Scope این Phase بود). قبل/حین Phase 5 (Address +
    Map) باید این فرم به Dropdown مبتنی بر این API‌ها مهاجرت کند.
- ✅ Neshan Map — تصمیم معماری (بند ۴ سند Audit): `NEXT_PUBLIC_NESHAN_API_KEY`
  انتخاب شد (نه `NESHAN_API_KEY`) چون ویجت نقشه در مرورگر اجرا می‌شود؛
  دلیل کامل در `src/config/env.ts`. اضافه شد به Schema اعتبارسنجی Env
  (اجباری) و `.env.example`. یک لایه پیکربندی مشترک در
  `src/lib/neshan/config.ts` ساخته شد که Phase 5 (Map Picker واقعی) از
  آن استفاده می‌کند. **کاربر باید مقدار واقعی Key را خودش در Vercel
  Environment Variables اضافه کند** — تا آن زمان Build/Deploy با خطای
  Env ناقص متوقف می‌شود (رفتار یکسان با بقیه Secret های پروژه).
- ✅ Address + Map Picker (بند ۵ سند Audit): به‌جای ساخت یک Model
  Address کاملاً مستقل (که چون هیچ Address Book مستقلی برای مشتری در
  Scope فعلی پروژه نبود، فقط پیچیدگی بدون فایده اضافه می‌کرد)، زیرساخت
  روی همان `Order.shippingAddress` موجود ساخته شد — که تنها محل واقعی
  دریافت آدرس در پروژه است:
  - دو فیلد اختیاری `latitude`/`longitude` به `IShippingAddress` (هم
    Model هم Validation Zod) اضافه شد — Additive و Backward-compatible،
    سفارش‌های قدیمی این دو فیلد را ندارند و مشکلی ایجاد نمی‌کند.
  - `ProvinceCitySelect` (`src/components/addresses/`) — کامپوننت
    مشترک دو Dropdown استان→شهر (شهر فقط بعد از انتخاب استان فعال
    می‌شود)، مصرف‌کننده APIهای Phase 3. جایگزین دو `Input` آزاد قبلی
    در فرم سفارش شد؛ اکنون هیچ Input متنی برای استان/شهر باقی نمانده
    (رفع دقیق TODO یادداشت‌شده در Phase 3).
  - `NeshanMapPicker` (`src/components/maps/`) — نقشه Leaflet نشان
    (پکیج رسمی `@neshan-maps-platform/leaflet`) با Marker
    قابل‌جابه‌جایی/کلیک‌پذیر؛ روی «تأیید موقعیت» با
    `GET https://api.neshan.org/v5/reverse` (مستقیم از Client، هدر
    `Api-Key`) استان/شهر/آدرس را تلاش می‌کند خودکار پر کند. اگر
    Reverse Geocoding شکست بخورد یا فیلدی نداشته باشد، فقط Lat/Lng را
    برمی‌گرداند و بقیه فیلدها دستی می‌مانند — دقیقاً طبق نکته صریح سند.
    بارگذاری SDK با `import()` پویا داخل `useEffect` است (نه Import
    ایستا) چون کتابخانه به `window` نیاز دارد و باید کاملاً از SSR
    Next.js کنار گذاشته شود.
  - فرم سفارش (`order-form.tsx`) و نمایش جزئیات سفارش
    (`order-detail-card.tsx`) هر دو به‌روزرسانی شدند: دیگر Input آزاد
    برای استان/شهر ندارند، و اگر Lat/Lng ثبت شده باشد لینک «نمایش روی
    نقشه نشان» نمایش داده می‌شود.
  - Type Shim در `src/types/neshan-maps-platform-leaflet.d.ts` چون
    پکیج رسمی نشان فایل `.d.ts` عرضه نمی‌کند.
  - ⚠️ **Address Book مستقل مشتری** (چند آدرس ذخیره‌شده به ازای هر
    مشتری، انتخاب از میان آن‌ها در Checkout) هنوز طراحی نشده — این در
    Scope فعلی نبود چون Checkout عمومی هنوز وجود ندارد (Storefront).
    وقتی Storefront/Cart (Phase 6-7) ساخته شود، این زیرساخت
    (`ProvinceCitySelect`/`NeshanMapPicker`) مستقیماً در آن فرم هم
    قابل استفاده مجدد است؛ فقط یک Model `Address` جدا با `customer`
    Ref لازم می‌شود.
- ❌ ~~Storefront Product APIs~~ **[حذف شد به دستور صریح کارفرما —
  نگاه کنید بخش «In Progress»]** — این چهار Route قبلاً ساخته شده
  بودند ولی همراه با کل کار Storefront مرحله ۱ حذف شدند. توضیحات زیر
  فقط به‌عنوان یادداشت طراحی برای بازسازی احتمالی آینده نگه داشته
  شده‌اند، **این Routeها دیگر در پروژه وجود ندارند:**
  (بند ۶ سند Audit) — چهار Route عمومی
  (بدون Auth، اولین‌بار در Phase 2 با social-links شروع شد) که همگی
  فقط محصولات `published`/حذف‌نشده را برمی‌گردانند:
  - `GET /api/v1/products/latest` — ساده، `Product.paginate` با
    `sort: createdAt desc`.
  - `GET /api/v1/products/best-discounts` — چون تخفیف می‌تواند
    Percent یا Amount ثابت باشد، «درصد مؤثر» فقط بعد از محاسبه با
    قیمت واقعی هر Variant مشخص می‌شود (نه با یک Query ساده روی
    Mongo)؛ کاندیدها (محصولات با حداقل یک Variant تخفیف‌دار) با Query
    محدود می‌شوند، محاسبه/مرتب‌سازی/Pagination در لایه Application.
    ⚠️ TODO بهینه‌سازی آینده در صورت رشد کاتالوگ: یک فیلد
    denormalized مثل `maxDiscountPercent` روی خود سند Product نگه
    داشته و Index شود.
  - `GET /api/v1/products/best-selling` — Aggregation واقعی روی
    `Order` (نه Mock): مجموع `quantity` هر محصول در سفارش‌های غیر
    `cancelled`/`returned`. معیار در ثابت `EXCLUDED_STATUSES` نگه
    داشته می‌شود تا تغییرش در آینده ساده باشد (طبق درخواست صریح سند
    «باید مشخص و قابل توسعه باشد»).
  - `GET /api/v1/products/amazing-offers` — همان تعریف
    `getAmazingOfferStatus === "active"` (که Dashboard هم استفاده
    می‌کند) به‌عنوان شرط Query تکرار شده (`isActive` + بازه
    `startAt`/`endAt`) تا فیلتر در سطح DB انجام شود، نه بعد از
    بارگذاری کامل. جدا از `GET /api/v1/amazing-offers` داخل Dashboard
    (که Auth دارد و همه رکوردها را برای مدیریت نشان می‌دهد).
  - تابع مشترک خالص `buildPublicProductSummary`
    (`src/lib/storefront/product-summary.ts`) شکل خروجی هر ۴ API را
    یکسان می‌کند؛ ۷ تست Unit دارد.
  - همه ۴ API: Pagination، Zod Validation روی Query، بدون N+1 (یک
    Aggregation/Query در هر درخواست، نه یک Query به ازای هر محصول).
- ✅ Cart (بند ۷ سند Audit) — طراحی و پیاده‌سازی کامل:
  - **تصمیم معماری — فقط Authenticated Cart، بدون Guest Cart فعلاً:**
    سیستم OTP فعلی (`/api/v1/auth/otp/verify`) از قبل برای *هر* شماره
    موبایل کار می‌کند و اگر کاربر جدید باشد با نقش `customer` ساخته
    می‌شود — یعنی زیرساخت Login عمومی مشتری از قبل وجود دارد، فقط UI
    عمومی (Storefront) هنوز نیست. پس تصمیم گرفتم Cart فقط برای
    `user` احراز‌هویت‌شده باشد (`Cart.user` یکتا و اجباری). طبق
    درخواست صریح سند، این تصمیم این‌جا مستند است و مسیر افزودن Guest
    Cart در آینده مشخص شده: کافی است `user` اختیاری شود + یک
    `guestToken` اضافه شود + یک مرحله Merge روی Login — هیچ‌کدام از
    `items[]`/موتور قیمت‌گذاری تغییر نمی‌کند چون کاملاً از هویت مالک
    مستقل‌اند.
  - `Cart` Model: `user` (یکتا) + `items[]` (هر Item: `product`,
    `variantId`, `quantity`, و فیلدهای قیمتی که **هرگز از Client
    نمی‌آیند**) + `cartTotal`.
  - `recomputeCartItem` (`src/lib/cart/recompute-cart-item.ts`) —
    تابع **خالص** که قلب منطق قیمت‌گذاری/در‌دسترس‌بودن یک Item است؛
    فقط از روی وضعیت *زنده* Variant تصمیم می‌گیرد (بند ۹-۱۳: «Cart
    نباید به قیمت‌های قدیمی Client اعتماد کند»). ۱۱ تست Unit — دقیقاً
    سناریوهای خواسته‌شده در بند تست سند (Product/Variant حذف‌شده،
    غیرفعال، موجودی ناکافی، تغییر قیمت، صفر بودن موجودی، و...).
  - `recalculateCart` (`src/lib/cart/cart-service.ts`) — با **یک**
    Query تمام محصولات داخل Cart را می‌گیرد (نه N+1)، `recomputeCartItem`
    را برای هر Item صدا می‌زند، و `cartTotal` را از نو می‌سازد. در هر
    عملیات (GET/POST/PATCH/DELETE Item/`validate`) صدا زده می‌شود —
    یعنی قیمت/موجودی همیشه Real-time است، دقیقاً طبق بند ۱۴.
  - APIها (همه با `requireAuthenticatedUser` — نه `requireApiUser`،
    چون نقش `customer` هیچ Permission ای در RBAC ندارد و RBAC فقط
    برای دسترسی Dashboard طراحی شده بود):
    - `GET /api/v1/cart`
    - `POST /api/v1/cart/items` — قبل از افزودن، وجود/فعال‌بودن
      Product/Variant و کفایت موجودی صریحاً چک می‌شود (نه فقط بعداً
      در Recalculate)؛ اگر همان Variant از قبل در Cart باشد، تعداد
      Merge می‌شود نه یک ردیف تکراری.
    - `PATCH /api/v1/cart/items/:itemId`
    - `DELETE /api/v1/cart/items/:itemId`
    - `DELETE /api/v1/cart`
    - `POST /api/v1/cart/validate` — دقیقاً همان `recalculateCart`،
      برای فراخوانی صریح پیش از Checkout.
  - **Cart در حال حاضر هیچ موجودی را Reserve نمی‌کند** — موجودی فقط
    در لحظه Add/Update چک می‌شود، طبق دستور صریح سند («صرفاً موجودی را
    رزرو نکن مگر معماری صراحتاً Reservation داشته باشد»).
  - ⚠️ **خارج از Scope این Phase (طبق تأیید صریح کاربر، فقط Phase ۲
    تا ۷):** ادغام Cart با Coupon/Category Discount/Amazing
    Offer/Wallet، اتصال Cart به فرآیند Order Creation واقعی
    (Checkout)، و مدیریت Race Condition در لحظه Checkout — این‌ها
    دقیقاً Phase 8 خود سند («Integration بین Cart، Discount،
    Inventory و Wallet») هستند و باید جداگانه تأیید شوند.
- ✅ Phase 8 (بخش Discount) — هماهنگی Cart با Coupon:
  - `Cart.appliedCoupon` — فقط یک ارجاع سبک (`{coupon, code}`)؛ مبلغ
    واقعی تخفیف **هرگز Persist نمی‌شود** و هر بار در `recalculateCart`
    از نو محاسبه می‌شود، دقیقاً به همان دلیل قیمت هر Item (بند ۹-۱۳).
  - از همان توابع خالص موجود Order (`validateCouponEligibility` و
    `computeCouponDiscount` در `src/lib/discounts/`) استفاده شد — نه
    منطق موازی جدید. `eligibleAmount` همان `cart.cartTotal` است که
    دقیقاً معادل `subtotal` سفارش واقعی است (بعد از تخفیف Variant، قبل
    از تخفیف Coupon) — یعنی عددی که در Cart دیده می‌شود، در Checkout
    واقعی هم تکرار خواهد شد.
  - `POST /api/v1/cart/coupon` (اعمال) و `DELETE /api/v1/cart/coupon`
    (حذف). عمداً **هیچ‌چیز روی `Coupon.usedCount`/`CouponRedemption`
    ثبت نمی‌شود** — «استفاده واقعی» فقط لحظه ثبت سفارش واقعی اتفاق
    می‌افتد (دقیقاً مثل قبل)، وگرنه سبدهایی که هرگز خرید نمی‌شوند
    ظرفیت کد تخفیف را هدر می‌دادند.
  - هر بار `recalculateCart` صدا زده می‌شود، کد تخفیف اعمال‌شده
    (اگر باشد) هم دوباره اعتبارسنجی می‌شود؛ اگر Itemها عوض شده باشند
    و دیگر حداقل مبلغ رعایت نشود، یا کد منقضی/غیرفعال شده باشد، خودش
    را از Cart پاک می‌کند. همین‌جا اعمال چندباره تخفیف (بند ۸) هم غیر
    ممکن است، چون همیشه حداکثر یک کد فعال روی Cart وجود دارد.
  - `serializeCart` حالا `appliedCoupon`, `discountAmount`, و
    `grandTotal` (= `cartTotal - discountAmount`) هم برمی‌گرداند.
  - ⚠️ **Amazing Offer روی Cart اعمال نشد** (فقط Coupon): چون
    Amazing Offer در حال حاضر یک تخفیف روی خود Variant نیست، بلکه یک
    رکورد جدا با بازه زمانی است (`src/models/AmazingOffer.ts`) که در
    Order Creation فعلی هم اصلاً استفاده نمی‌شود (`amazing-offers`
    API که در Phase 6 ساختیم فقط برای *نمایش* در Storefront است). قبل
    از اتصال آن به Cart باید مشخص شود Amazing Offer دقیقاً چطور باید
    با تخفیف عادی Variant و Coupon تعامل کند (اولویت؟ Exclusive؟) —
    این یک تصمیم معماری با اثر گسترده است که باید جداگانه تأیید شود،
    نه چیزی که بشود بدون هماهنگی حدس زد.
- ⚠️ **Phase 8 (بخش Wallet) — انجام نشد، نیازمند تصمیم شما:**
  طبق Audit خود Phase 1، سیستم Wallet **اصلاً وجود ندارد** (نه Model،
  نه Balance، نه Transaction). «هماهنگی Cart با Wallet» در سند به
  این معناست که در Checkout بشود بخشی/کل مبلغ را از Wallet پرداخت
  کرد — این نیازمند طراحی یک زیرسیستم مالی کامل (Model Wallet،
  Transaction Log، قوانین Top-up/Refund/تنظیم توسط ادمین) است، نه
  یک تغییر کوچک روی Cart. ساختار فعلی Cart (`cartTotal`/`grandTotal`
  به‌عنوان یک عدد واحد نهایی) هیچ مانعی برای Payment Split در آینده
  ایجاد نمی‌کند — یعنی معماری فعلی خودش را قفل نکرده — اما ساخت خود
  Wallet باید یک تصمیم/Task جداگانه با تأیید صریح شما باشد.
- ✅ Phase 8 (بخش Amazing Offer در Cart) — تصمیم شما: «بیشترین
  تخفیف بین این دو انتخاب شود». `recomputeCartItem` حالا یک پارامتر
  چهارم اختیاری `amazingOffer` می‌گیرد؛ اگر شگفت‌انگیز *زنده*ای
  (isActive + داخل بازه startAt/endAt) روی همان Variant باشد، قیمت
  نهایی هر دو منبع (تخفیف عادی Variant، تخفیف شگفت‌انگیز) محاسبه و
  کمترین آن‌ها (= بیشترین تخفیف) انتخاب می‌شود — هرگز هر دو با هم
  جمع نمی‌شوند (بند ۸: «مراقب باش Discount چند بار اعمال نشود»).
  `recalculateCart` یک Query اضافه برای شگفت‌انگیزهای زنده مربوط به
  محصولات داخل Cart می‌زند (نه N+1). ۴ تست جدید اضافه شد (۱۵ تست کل
  در `recompute-cart-item.test.ts`).
- ✅ Phase 8 (بخش Wallet) — نسخه ساده طبق تصمیم صریح شما: **بدون
  درگاه پرداخت، فقط موجودی + تعدیل دستی توسط ادمین**:
  - `Wallet` (`user` یکتا، `balance >= 0`) + `WalletTransaction`
    (Append-only، شبیه الگوی `ActivityLog`: هر تغییر با نوع، مبلغ،
    موجودی بعد از تراکنش، دلیل، و کدام ادمین انجام داده ثبت می‌شود).
  - `adjustWalletBalance` — تعدیل با `findOneAndUpdate` + `$inc`
    **Atomic** روی خود Mongo؛ برای کاهش موجودی، شرط
    `balance >= amount` داخل همان Query است (نه یک چک جدا قبل از
    نوشتن) — یعنی حتی دو تعدیل هم‌زمان هرگز موجودی را منفی نمی‌کنند؛
    Race Condition این‌جا از نظر ساختاری غیرممکن است.
  - `checkWalletAdjustment` — تابع خالص برای پیام خطای فوری/تست
    (۶ تست).
  - RBAC: `WALLET_READ` (Staff+)، `WALLET_MANAGE` (Admin+، فقط
    ادمین می‌تواند موجودی را تغییر دهد).
  - APIها: `GET /api/v1/wallet` (خود کاربر، `requireAuthenticatedUser`
    — آماده برای استفاده آینده Storefront)، `GET
    /api/v1/wallets/:userId` (Staff، مشاهده کیف پول یک مشتری خاص)،
    `POST /api/v1/wallets/:userId/adjust` (Admin، افزایش/کاهش دستی).
  - UI: بخش «کیف پول» به صفحه جزئیات مشتری
    (`/dashboard/customers/[id]`) اضافه شد — نمایش موجودی، فرم تعدیل،
    تاریخچه تراکنش‌ها.
  - **Cart هنوز مستقیماً به Wallet وصل نشده** (طبق تصمیم قبلی، چون
    Checkout واقعی هنوز وجود ندارد)؛ این زیرساخت پایه است که وقتی
    Checkout ساخته شود (خارج از Scope فعلی)، «پرداخت با کیف پول» یا
    «پرداخت ترکیبی» رویش سوار می‌شود.
- ✅ Phase 9 — Testing: پوشش تست برای همه چیزهایی که در این
  Task (Phase 2 تا 8) ساخته شد کامل شد — با یک محدودیت مهم که باید
  شفاف باشد:
  - **نوع تست‌های این پروژه از قبل (Phase 7 به قبل) Unit Test روی
    توابع خالص + Zod Schema است** — هیچ زیرساخت Integration/API Test
    واقعی (مثل `mongodb-memory-server` برای اجرای واقعی Route‌ها با
    یک DB واقعی در CI) در پروژه وجود ندارد؛ `vitest.config.ts` با
    `environment: "node"` فقط منطق خالص را اجرا می‌کند. بنابراین
    «Integration Test»/«API Test» به شکلی که سند خواسته (تست کامل یک
    Request واقعی HTTP از ابتدا تا انتها با DB واقعی) در این Phase
    ساخته **نشد** — این یک Task جداگانه (راه‌اندازی زیرساخت تست) است
    که باید صریحاً تأیید شود، نه چیزی که بشود ضمنی اضافه کرد.
  - **آنچه واقعاً اضافه شد:** تست‌های Unit برای تمام Zod Schema های
    جدیدی که در این جلسه ساخته شدند و قبلاً تست نداشتند:
    `src/lib/validations/cart.test.ts` (۱۰ تست — Quantity نامعتبر،
    ObjectId نامعتبر، فیلد گمشده)، `wallet.test.ts` (۸ تست —
    مبلغ صفر/منفی/اعشاری، دلیل کوتاه)، `storefront-products.test.ts`
    (۵ تست — Pagination نامعتبر)، `orders.test.ts` (۷ تست — دقیقاً
    سناریوی «Lat/Lng خارج از بازه مجاز» از بند تست سند، روی
    `shippingAddressSchema` که اکنون Export شده).
  - جمع کل تست‌ها از ۱۴۰ به **۱۷۰** رسید.
  - سناریوهای Cart خواسته‌شده در سند (Add/Increase/Decrease/Remove،
    Empty Cart، Product/Variant Unavailable، Insufficient Inventory،
    Price Changed، Discount Changed، Deactivated) همگی از قبل در
    `recompute-cart-item.test.ts` (Phase 7-8) پوشش داده شده بودند —
    چون این تابع خالص دقیقاً همان منطقی است که همه این سناریوها را
    تصمیم می‌گیرد؛ سناریوی «Concurrent Checkout» قابل تست نیست چون
    Checkout واقعی هنوز وجود ندارد.
  - سناریوهای Address/Map سند: «انتخاب استان/شهر» و «شهر نامرتبط با
    استان» در سطح UI (`ProvinceCitySelect`) با انتخاب از Dropdown
    اجرایی است، نه ورودی آزاد — این پروژه از قبل کامپوننت React را
    Unit Test نمی‌کند (بدون `jsdom`/Testing Library)، پس تستی برای
    خود کامپوننت اضافه نشد. **⚠️ یافته مهم این Phase:** چون
    `Order.shippingAddress` نام‌ها را ذخیره می‌کند (نه ID)، هیچ
    اعتبارسنجی سمت سرور وجود ندارد که «شهر واقعاً متعلق به همان استان
    است» — این کنترل فقط در UI (Dropdown وابسته) تضمین می‌شود، نه در
    API. تصمیم گرفتم این را نسازم چون به Query کردن نام (نه ID) نیاز
    دارد که شکننده است (تفاوت فاصله/نویسه)؛ به‌جایش این‌جا مستند شد.
- ✅ Phase 10 — Documentation نهایی:
  - `docs/API.md` — مستندات کامل تمام APIهای جدید Phase 2 تا 8
    (Social Links، Province/City+Import، Neshan، Address، ۴ API
    عمومی محصول Storefront، Cart+Coupon، Wallet)؛ شامل Method، Path،
    سطح دسترسی، شکل Request/Response، و قوانین کلیدی هر بخش.
  - `README.md` — کاملاً به‌روزرسانی شد (نسخه قبلی از زمان
    Bootstrap اولیه پروژه مانده بود و می‌گفت «هنوز هیچ Feature
    پیاده‌سازی نشده» و «هنوز Test نوشته نشده» — که دیگر درست نبود).
    اکنون Tech Stack، Environment Variables (شامل
    `NEXT_PUBLIC_NESHAN_API_KEY`)، Git Workflow (اصلاح شد به
    «مستقیم روی main»، نسخه قبلی همچنان می‌گفت «دو Branch جدا»)،
    و وضعیت واقعی فعلی پروژه را نشان می‌دهد.
  - `.env.example` از Phase 4 به بعد به‌روز نگه داشته شده (بدون
    نیاز به تغییر بیشتر در این Phase).
- ✅ Checkout واقعی — Cart متصل به Order Creation + پرداخت ترکیبی:
  - **Refactor بدون تغییر رفتار:** منطق واقعی ایجاد سفارش از
    `POST /api/v1/orders` (که فقط Staff با `ORDERS_UPDATE` صدا
    می‌زند) به یک سرویس مشترک منتقل شد:
    `src/lib/orders/create-order.ts` (`createOrder()`، خطاها با
    `OrderCreationError` شامل `status`). همچنین منطق شروع پرداخت از
    `POST /api/v1/payments/initiate` به
    `src/lib/payment/initiate-order-payment.ts`
    (`initiateOrderPayment()`) منتقل شد. هر دو Route قدیمی حالا فقط
    Auth+Validation دارند و همان تابع مشترک را صدا می‌زنند — رفتار
    قبلی‌شان کاملاً حفظ شد، فقط Duplicate از بین رفت.
  - **`POST /api/v1/checkout`** — اولین Endpoint واقعی Checkout
    پروژه، با `requireAuthenticatedUser` (نه یک Permission RBAC،
    چون خود مشتری صاحب سفارش است):
    1. Cart کاربر را بازمحاسبه می‌کند (دقیقاً مثل
       `cart/validate`) — رد می‌کند اگر خالی باشد یا Itemی
       `isAvailable: false` داشته باشد.
    2. Itemهای Cart را با `createOrder()` (همان تابع مشترک Dashboard)
       به یک سفارش واقعی تبدیل می‌کند — یعنی همان بازمحاسبه قیمت از
       DB، رزرو Atomic کد تخفیف، و کسر موجودی که از قبل در
       Dashboard تست‌شده بود، این‌جا هم عیناً اجرا می‌شود؛ کد تخفیف
       اعمال‌شده روی Cart (`cart.appliedCoupon`) مستقیماً به
       `createOrder` پاس داده می‌شود.
    3. بعد از موفقیت، Cart را کامل خالی می‌کند.
    4. اگر `paymentMethod !== "cash"`، بلافاصله
       `initiateOrderPayment()` را با همان `useWallet` که کاربر
       فرستاده صدا می‌زند (پرداخت ترکیبی Wallet+درگاه، بدون یک
       Round-trip HTTP اضافه به Route دیگر).
    5. اگر ایجاد سفارش موفق بود ولی شروع پرداخت شکست خورد، سفارش را
       از دست نمی‌دهیم — پاسخ ۲۰۱ با `payment: null` و
       `paymentError` برمی‌گردد؛ مشتری بعداً می‌تواند دوباره تلاش کند.
  - ⚠️ **بدون موتور محاسبه هزینه ارسال:** `shippingCost` مستقیماً از
    Client گرفته می‌شود (همان ریسکی که فرم سفارش Dashboard هم از قبل
    داشت) — چون هیچ سرویس محاسبه خودکار هزینه ارسال (بر اساس فاصله
    Lat/Lng که در Phase 5 ذخیره می‌شود) هنوز ساخته نشده.
  - ۶ تست جدید Validation برای `checkoutSchema` — ۱۸۹ تست کل.
- ✅ Wallet — تکمیل به نسخه قابل استفاده کامل (طبق درخواست صریح
  کارفرما، فراتر از نسخه ساده Phase 8):
  - **واریز (Top-up):** `WalletTopup` (مدل جدا از `Payment` — چون
    `Payment.order` اجباری است و شارژ کیف پول به هیچ سفارشی وصل
    نیست). `POST /api/v1/wallet/topup` یک Session زرین‌پال می‌سازد
    (دقیقاً همان الگوی `payments/initiate`)؛
    `GET /api/v1/wallet/topup/callback` (عمومی، بدون Auth — چون
    زرین‌پال مرورگر خود کاربر را برمی‌گرداند) بعد از Verify واقعی با
    زرین‌پال، موجودی را با همان `adjustWalletBalance` مشترک اعتبار
    می‌دهد. صفحه نتیجه: `/wallet/topup/result`.
  - **درخواست برداشت (تسویه به کارت/شبا):** `WithdrawalRequest` —
    چون هیچ API واقعی Payout خودکار وصل نیست، این یک صف بررسی دستی
    است: مبلغ همان لحظه ثبت درخواست Atomic کسر می‌شود (نه لحظه تأیید
    ادمین) تا کاربر نتواند با چند درخواست هم‌زمان بیشتر از موجودی
    واقعی‌اش خرج کند؛ اگر رد شود مبلغ برمی‌گردد.
    `POST /api/v1/wallet/withdrawals` (خود کاربر)،
    `GET /api/v1/wallets/withdrawals` + `POST
    /api/v1/wallets/withdrawals/:id/review` (Admin، `WALLET_MANAGE`).
    UI: صفحه صف بررسی در `/dashboard/wallets/withdrawals` (لینک در
    Nav اصلی Dashboard اضافه شد، نه زیرمجموعه Settings، چون یک Action
    Queue است نه یک تنظیم).
  - **پرداخت ترکیبی (Wallet + Zarinpal):** `POST
    /api/v1/payments/initiate` حالا یک فیلد اختیاری `useWallet`
    می‌گیرد. اگر true باشد، تا سقف موجودی واقعی کیف پول مشتری از
    مبلغ باقی‌مانده کسر می‌شود (Atomic) و فقط باقیمانده واقعی به
    زرین‌پال فرستاده می‌شود؛ اگر کل مبلغ را کیف پول پوشش دهد، اصلاً
    به درگاه نیاز نیست. `Payment` یک فیلد جدید `walletAmount` گرفت
    (Additive، پیش‌فرض ۰، سازگار با رکوردهای قدیمی) تا سهم کیف پول از
    سهم درگاه جدا بماند.
  - **⚠️ نکته صحت مالی مهم که اضافه شد:** اگر بعد از کسر بخش کیف پول،
    تلاش درگاه شکست بخورد یا کاربر لغو کند،
    `payments/callback` همان بخش کیف پول را خودکار برمی‌گرداند —
    وگرنه مشتری بابت یک تلاش پرداخت ناموفق واقعاً پول از دست می‌داد.
    این جبران دقیقاً یک‌بار اتفاق می‌افتد (به کمک همان Guard موجود که
    از پردازش دوباره یک Payment که قبلاً به `failed` رفته جلوگیری
    می‌کند).
  - ۲۱ تست جدید Validation (Topup/Withdrawal/Review) — ۱۸۳ تست کل.
  - RBAC از قبل موجود (`WALLET_READ`/`WALLET_MANAGE`) بدون تغییر
    دوباره استفاده شد.
- ✅ Audit / Activity Log (بند ۵۳): مدل `ActivityLog` Append-only
  (بدون API ویرایش/حذف — یک Audit Trail واقعی باید غیرقابل‌دستکاری
  بماند)؛ `actorName` به‌صورت Snapshot ذخیره می‌شود نه Populate زنده،
  تا اگر بعداً نام کاربر عوض شد یا حذف شد، متن لاگ خوانا بماند؛ ثبت
  Best-effort دقیقاً با همان الگوی پیامک سفارش (شکست لاگ هرگز عملیات
  اصلی را متوقف نمی‌کند)؛ فعلاً روی رویدادهای زیر Wire شده: تغییر
  نقش/وضعیت کاربر، تغییر وضعیت سفارش، ساخت/ویرایش/حذف Coupon، ویرایش
  تنظیمات پاداش پرداخت، ساخت/ویرایش/حذف Amazing Offer؛ صفحه نمایش در
  `/dashboard/settings/activity-log` (فقط خواندنی، Permission
  اختصاصی `ACTIVITY_LOG_READ`، Admin+)
- ✅ محتوای سایت (درباره ما / تماس با ما / سوالات متداول) — درخواست
  صریح کارفرما، همان الگوی Social Links (اولین Route عمومی پروژه):
  - `AboutUs` (Singleton، `src/models/AboutUs.ts`): `title`, `content`,
    `imageUrl` (اختیاری، فقط لینک — بدون آپلود اختصاصی Cloudinary).
  - `ContactUs` (Singleton، `src/models/ContactUs.ts`): `phone`,
    `secondaryPhone`, `email`, `address`, `workingHours`, و
    `latitude`/`longitude` اختیاری — فرم Dashboard از همان
    `NeshanMapPicker` مرحله ۵ سند Audit استفاده مجدد می‌کند (بدون هیچ
    منطق نقشه جدید) تا موقعیت فروشگاه انتخاب شود.
  - `Faq` (لیست معمولی، `src/models/Faq.ts`، الگوی `Color`):
    `question`, `answer`, `isActive`, `sortOrder` — CRUD کامل.
  - APIها: `GET/PATCH /api/v1/about-us`, `GET/PATCH
    /api/v1/contact-us`, `GET/POST /api/v1/faqs`, `PATCH|DELETE
    /api/v1/faqs/:id`. هر سه `GET` عمداً بدون Auth (هم Dashboard هم
    Storefront آینده مصرف می‌کنند، داده حساس نیست)؛ نوشتن با
    `SETTINGS_MANAGE` محافظت می‌شود (پرمیشن جدیدی اضافه نشد — از
    همان Permission تنظیمات محتوایی موجود استفاده شد).
  - UI: `/dashboard/settings/about-us`, `/dashboard/settings/contact-us`,
    `/dashboard/settings/faq` (لیست + Modal ساخت/ویرایش، دقیقاً الگوی
    `ColorsManager`/`ColorFormModal`)؛ لینک هر سه به صفحه اصلی
    `/dashboard/settings` اضافه شد.
  - ۲۰ تست Unit جدید برای سه Validation Schema (`about-us.test.ts`,
    `contact-us.test.ts`, `faqs.test.ts`) — ۲۰۹ تست کل.

- ✅ **مدیریت مالی — Phase 1 (بانک‌ها + چک‌های دریافتی)** — طبق سند
  «Master Prompt — Financial Management, Check Management & Order
  Payments»، فقط Phase 1 (چک‌های دریافتی) اجرا شد؛ Phase 2 (روش‌های
  دریافت وجه + اتصال Payment↔Check↔Order) منتظر تأیید صریح کارفرماست:
  - `Bank` (`src/models/Bank.ts`): `name` (unique)، `logoUrl`/
    `logoPublicId` (آپلود Cloudinary، پوشه جدید `saghchi-carpet/banks`)،
    `isActive`، `sortOrder`. بدون DELETE — فقط غیرفعال‌سازی (چون چک‌های
    قدیمی ممکن است ارجاع داشته باشند).
  - `Check` (`src/models/Check.ts`): بانک، صادرکننده (نام/نام‌خانوادگی/
    کدملی)، دریافت‌کننده (ref User، محدود به role=admin|super_admin)،
    ضامن اختیاری، شماره تماس، تاریخ دریافت/سررسید، مبلغ (Number،
    تومان)، سری چک، شناسه چک (هر دو حداکثر ۶ رقم)، شناسه صیادی (دقیقاً
    ۱۶ رقم)، `status` (enum قابل توسعه در
    `src/lib/constants/check-status.ts` — فقط `not_registered` /
    `registered` / `returned` / `transferred` در این Phase فعال است)،
    `transferredTo`، `returnInfo`. **بدون DELETE در API** — عودت/انتقال
    Status را تغییر می‌دهند و در `returnInfo`/`transferredTo` ثبت
    می‌شوند، رکورد هرگز حذف نمی‌شود (Audit Trail کامل طبق الزام سند).
    اتصال به `Order`/`Payment` عمداً در این مدل نیست — طبق سند این
    اتصال متعلق به `Payment` در Phase ۲ است.
  - APIها: `GET/POST /api/v1/banks`, `PATCH /api/v1/banks/:id`,
    `GET/POST /api/v1/checks`, `GET/PATCH /api/v1/checks/:id`,
    `POST /api/v1/checks/:id/return`, `POST /api/v1/checks/:id/transfer`.
  - Permissionهای جدید: `BANKS_READ`, `BANKS_MANAGE`, `CHECKS_READ`,
    `CHECKS_CREATE`, `CHECKS_UPDATE`, `CHECKS_RETURN`,
    `CHECKS_TRANSFER` (Staff فقط READ، Admin+ همه).
  - اعتبارسنجی کد ملی ایرانی: `src/lib/utils/national-id.ts`
    (الگوریتم Checksum استاندارد ۱۰ رقمی، Pure Function، تست‌شده).
  - مبلغ به حروف: `src/lib/utils/number-to-words.ts` — از مقدار
    عددی تولید می‌شود (طبق الزام سند، بدون ذخیره تکراری در DB).
  - آپلود لوگوی بانک از همان مسیر Signed Upload موجود پروژه استفاده
    می‌کند؛ `/api/v1/uploads/sign` یک پارامتر `target` («product-image»
    پیش‌فرض یا «bank-logo») گرفت تا پوشه/Permission را انتخاب کند —
    بدون هیچ Route موازی جدید برای امضای آپلود.
  - Activity Log: `check.created`, `check.updated`, `check.returned`,
    `check.transferred` با همان سیستم `ActivityLog` موجود ثبت می‌شوند.
  - UI: `/dashboard/settings/banks` (لیست + Modal + آپلود لوگو +
    فعال/غیرفعال)، `/dashboard/checks` (لیست با Search/Filter/
    Pagination)، `/dashboard/checks/new` (فرم ثبت)،
    `/dashboard/checks/:id` (جزئیات + دکمه‌های عودت/انتقال — فقط روی
    وضعیت `registered` نمایش داده می‌شوند). آیتم ناوبری جدید
    «چک‌های دریافتی» در `dashboard-nav.ts`.
  - ۴۳ تست Unit جدید (`national-id.test.ts`, `number-to-words.test.ts`,
    `checks.test.ts`, `banks.test.ts`) — ۲۵۲ تست کل، همه سبز.
  - Build/TypeScript/ESLint هر سه سبز.

- ✅ **مدیریت مالی — Phase 2 (روش‌های دریافت وجه + اتصال
  Payment↔Check↔Order)** — طبق تأیید صریح کارفرما اجرا شد:
  - `CardAccount` (`src/models/CardAccount.ts`): کارت/حساب بانکی
    فروشگاه برای دریافت کارت‌به‌کارت — `cardNumber` (۱۶ رقم)،
    `accountNumber`، `ownerName`، `isActive`. بدون DELETE (مثل Bank).
  - `PosTerminal` (`src/models/PosTerminal.ts`): کارتخوان — `name`،
    `bank` (ref Bank، استفاده مجدد از همان مرجع بانک‌های Phase ۱)،
    `accountNumber`، `isActive`.
  - `Payment` توسعه یافت (Additive، بدون تغییر رفتار جریان Zarinpal
    موجود): فیلد جدید `method` (`zarinpal` | `cash` | `pos` |
    `card_transfer` | `check`)، `provider` مقدار جدید `"manual"`
    گرفت، رفرنس‌های اختیاری `posTerminal`/`cardAccount`/`check`، و
    Status جدید `"returned"` (برای Paymentِ نوع چک که چک متصل به آن
    عودت داده شده — هرگز حذف نمی‌شود، فقط از محاسبه دریافتی خارج
    می‌شود). Paymentهای دستی از `authority` ساختگی یکتا
    (`manual-<uuid>`) استفاده می‌کنند تا محدودیت unique قبلی دست‌نخورده
    بماند.
  - `Order.paidAmount` فیلد جدید (Additive) — فقط توسط
    `recalculateOrderPaymentTotals()`
    (`src/lib/payments/recalculate-order-payments.ts`) نوشته می‌شود:
    جمع Paymentهای `status: "paid"` این سفارش، و `remainingAmount` را
    از `totalAmount - paidAmount` بازمحاسبه می‌کند. **عمداً به مسیر
    آنلاین Zarinpal (`payments/callback`) وصل نشد** — طبق تصمیم
    مستندشده قبلی که موفقیت پرداخت آنلاین به‌تنهایی فیلدهای سفارش را
    تغییر نمی‌دهد؛ این تابع فقط زیرسیستم جدید پرداخت دستی را اداره
    می‌کند.
  - APIها: `GET/POST /api/v1/card-accounts`, `PATCH
    /api/v1/card-accounts/:id`, `GET/POST /api/v1/pos-terminals`,
    `PATCH /api/v1/pos-terminals/:id`, `GET/POST
    /api/v1/orders/:id/payments` (ثبت دریافت وجه دستی — نقدی/کارتخوان/
    کارت‌به‌کارت/چک؛ برای چک یا `checkId` یک چک ثبت‌شده موجود یا
    `newCheck` برای ثبت هم‌زمان چک جدید، دقیقاً طبق بند ۷ سند). مبلغ
    Payment نوع چک همیشه از `check.amount` سرور مشتق می‌شود، هرگز از
    Client گرفته نمی‌شود.
  - جلوگیری از تخصیص دوباره چک (بند ۹): قبل از ساخت Payment جدید از
    نوع چک، جست‌وجو می‌شود که آیا Payment فعال دیگری (`status !=
    "returned"`) از قبل به همان چک اشاره دارد.
  - اتصال به عودت چک (بند ۱۰): `checks/:id/return` حالا هر Payment
    متصل به آن چک را به `status: "returned"` می‌برد و بلافاصله
    `recalculateOrderPaymentTotals` سفارش مربوطه را صدا می‌زند —
    Payment/Check هرگز حذف نمی‌شوند (بند ۱۱).
  - Permission: پرمیشن جدیدی اضافه نشد — از `PAYMENTS_READ`/
    `PAYMENTS_MANAGE` موجود (که از قبل در RBAC تعریف شده بود ولی
    routeای از آن استفاده نمی‌کرد) برای CardAccount/PosTerminal/ثبت
    پرداخت دستی استفاده شد؛ طبق سند («اگر سیستم Permission فعلی
    ساختار متفاوتی دارد، با همان معماری موجود هماهنگ شو»).
  - Activity Log: رویداد جدید `order.payment_recorded` با همان سیستم
    `ActivityLog` موجود ثبت می‌شود؛ ثبت چک جدید در همین مسیر هم
    `check.created` را دوباره فراخوانی می‌کند (بدون Duplicate منطق —
    مستقیماً از همان الگوی Route چک‌ها).
  - UI: `/dashboard/settings/card-accounts`,
    `/dashboard/settings/pos-terminals` (لیست + Modal + فعال/غیرفعال،
    الگوی دقیق `BanksManager`)؛ در جزئیات سفارش، کامپوننت جدید
    `ManualPaymentsPanel` (بند ۱۱ سند: نمایش مبلغ کل / نقدی / کارتخوان
    / کارت‌به‌کارت / چک / مجموع پرداخت‌شده / باقی‌مانده + فرم «ثبت
    دریافت وجه» با انتخاب روش و برای چک، سوییچ «چک موجود» / «چک
    جدید»)؛ در جزئیات چک (بند ۱۴)، بخش «سفارش متصل» نمایش داده می‌شود
    اگر آن چک به Payment سفارشی وصل باشد.
  - ۱۹ تست Unit جدید (`card-accounts.test.ts`, `pos-terminals.test.ts`,
    `order-payments.test.ts`) — ۲۸۳ تست کل، همه سبز.
  - Build/TypeScript/ESLint هر سه سبز.

- ✅ **حذف پیامک خودکار وضعیت سفارش + دکمه ارسال دستی** — طبق درخواست
  کارفرما:
  - پیامک وضعیت سفارش دیگر خودکار ارسال نمی‌شود — نه در ثبت سفارش
    (`create-order.ts`) و نه در تغییر وضعیت
    (`orders/:id/status`). هر دو فراخوانی `sendOrderStatusSms` حذف
    شدند؛ خود تابع دست‌نخورده ماند (منطق پیام هنوز آنجاست).
  - Endpoint جدید: `POST /api/v1/orders/:id/notify-status` — پیامک
    وضعیت *فعلی* سفارش را برای مشتری ارسال می‌کند؛ Permission:
    `ORDERS_UPDATE`.
  - دکمهٔ «ارسال وضعیت به مشتری» در صفحهٔ جزئیات سفارش
    (`order-detail-card.tsx`) این Endpoint را صدا می‌زند و نتیجه
    (موفق/خطا) را زیر آن نمایش می‌دهد.
  - متن تأییدیهٔ تغییر وضعیت (Confirm Dialog) که به «ارسال خودکار
    پیامک» اشاره می‌کرد، به‌روزرسانی شد.

- ✅ **ارسال شماره کارت به مشتری (پیامکی)** — طبق درخواست کارفرما:
  - `CardAccount` توسعه یافت (Additive): `bank` (ref `Bank`) و
    `shabaNumber` اضافه شدند. هر دو در سطح Schema اختیاری‌اند (نه
    `required`) تا رکوردهای قدیمی‌تر بدون این دو فیلد هم بدون خطای
    Validation لود شوند؛ اما در Zod (`createCardAccountSchema`)
    هنگام ساخت کارت جدید هر دو الزامی‌اند.
  - `POST /api/v1/card-accounts/:id/send` — پیامک اطلاعات کارت
    (شماره کارت، شبا، نام بانک، نام صاحب حساب + نام فروشگاه) را به
    شماره موبایل واردشده ارسال می‌کند. اگر کارت هنوز بانک/شبا نداشته
    باشد، خطای واضح برمی‌گرداند (نه ارسال ناقص).
  - **متن پیامک قابل تغییرِ آسان**: کل قالب پیام در یک فایل مجزا
    تعریف شده — `src/lib/sms/card-share-message.ts`
    (`buildCardShareMessage`) — شامل ثابت `STORE_NAME` (فعلاً «سرای
    فرش سَقَطچی»). برای تغییر متن یا نام فروشگاه در آینده، فقط همین
    یک فایل ویرایش می‌شود؛ هیچ Route یا Componentای نیازی به تغییر
    ندارد.
  - منطق مشترک ارسال HTTP به sms.ir (که قبلاً فقط داخل
    `send-order-status-sms.ts` بود) به `src/lib/sms/send-bulk-sms.ts`
    منتقل شد تا بین «پیامک وضعیت سفارش» و «پیامک اطلاعات کارت»
    Duplicate نشود؛ `sendOrderStatusSms` بدون تغییر رفتار/امضا روی
    همان تابع مشترک بازنویسی شد (تست موجودش دست‌نخورده سبز است).
  - UI: در `CardAccountsManager` دکمهٔ ارسال (آیکن) روی هر ردیف؛
    Modal کوچک `SendCardAccountModal` برای گرفتن شماره موبایل مشتری.
    فرم کارت/حساب (`CardAccountFormModal`) فیلدهای بانک (Combobox) و
    شبا را هم گرفت.
  - ۲ تست Unit جدید برای `buildCardShareMessage` و `sendCardAccountSchema`
    — ۲۸۹ تست کل، همه سبز.
  - Build/TypeScript/ESLint هر سه سبز.

## 4. In Progress

**مدیریت مالی — Phase ۱ و Phase ۲ (Master Prompt — Financial
Management) تکمیل شدند.** سند اصلی فقط همین دو Phase را تعریف کرده
بود (پایان Phase ۲ در سند: «آیا تأیید می‌کنی وارد فاز بعدی مدیریت
مالی شوم؟») — فاز بعدی (هزینه‌ها/درآمدها/صندوق/تسویه‌حساب و...) هنوز
تعریف نشده و منتظر یک Master Prompt جدید یا تأیید صریح کارفرماست.

سند «بررسی تکمیل Backend/Dashboard و آماده‌سازی برای توسعه
Storefront» — **هر ۱۰ Phase آن کامل شد** (تا جایی که بدون یک
Checkout واقعی امکان‌پذیر بود؛ نگاه کنید Known Issues برای موارد
باقی‌مانده که به وجود یک Checkout واقعی وابسته‌اند).

**⚠️ به‌روزرسانی (تصمیم صریح کارفرما): کل کار Storefront UI مرحله ۱
حذف شد.** به دستور کارفرما، قبل از شروع واقعی توسعه Storefront، تمام
موارد زیر به‌طور کامل از پروژه حذف شدند:

- Route Group `(storefront)` (`layout.tsx` + `page.tsx` — Header +
  SearchBar)
- `src/components/storefront/` (StorefrontHeader, StorefrontSearchBar)
- `src/lib/storefront/product-summary.ts` و تست آن
  (`buildPublicProductSummary`)
- `src/lib/validations/storefront-products.ts` و تست آن
- چهار Route عمومی محصول Storefront: `GET /api/v1/products/latest`،
  `GET /api/v1/products/best-selling`، `GET
  /api/v1/products/best-discounts`، `GET /api/v1/products/amazing-offers`
  (این‌ها هم حذف شدند — کارفرما صریحاً تأیید کرد که API‌ها هم حذف
  شوند، نه فقط UI)
- Token های رنگی مستقل Storefront (`--sf-*` داخل کلاس `.storefront`
  در `src/app/globals.css`)

`src/app/page.tsx` (صفحه Placeholder «در حال ساخت») به حالت قبل از
شروع Storefront بازگردانده شد چون Route Group `(storefront)` که
جایگزینش کرده بود دیگر وجود ندارد.

**نتیجه:** Storefront از صفر و با معماری/تصمیمات جدید ساخته خواهد
شد. مرحله بعدی طبیعی: شروع واقعی توسعه صفحات Storefront (سند بررسی
Backend همچنان به‌عنوان پیش‌نیاز Backend معتبر است، اما پیاده‌سازی
UI مرحله ۱ آن Discard شد).

## 5. Planned (به ترتیب)

**Storefront — Homepage (طبق Master Workflow جدید کاربر، جایگزین
ترتیب قبلی این بخش؛ Sequential Workflow، یک ماژول در هر تأیید،
بدون تأیید صریح کاربر به ماژول بعدی نرو):**

- [x] Phase 1: Mobile Bottom Bar — انجام شد (نگاه کنید بخش ۲)
- [ ] Phase 2: Desktop Header
- [ ] Phase 3: Hero Slider (نیاز به مدل Banner — هنوز وجود ندارد)
- [ ] Phase 4: Special Offers Carousel
- [ ] Phase 5: Latest Products Carousel
- [ ] Phase 6: Most Discounted Products Carousel
- [ ] Phase 7: Best Sellers Carousel
- [ ] Phase 8: سایر بخش‌های موردنیاز Homepage (در صورت نیاز)
- [ ] Phase 9: Footer + شبکه‌های اجتماعی (فعلاً Placeholder — کاربر
  گفته لینک‌ها بعداً از طریق پنل Dashboard مدیریت می‌شوند؛ یک بخش
  Settings جدید برای این باید ساخته شود، هنوز نساخته‌ایم)
- [ ] بعد از صفحه اصلی: Products/Category/Product Detail/Search/Cart/
  Checkout/Login-OTP/Account/Orders/Address (بند ۶۹) — Checkout باید
  به مدل‌های موجود `Order`/`Payment` وصل شود، نه بازنویسی

**نکته معماری مهم کشف‌شده حین بررسی:** مدل‌های `Cart` و
`Favorite/Wishlist` هنوز در Backend وجود ندارند. طبق بند ۵۱ Master
Prompt این‌جا ثبت می‌شود: این دو باید به‌عنوان بخشی از خودِ کار
Storefront ساخته شوند (نه پیش‌نیاز مسدودکننده)، چون در فهرست بند ۶۹
جزو صفحات Storefront‌اند نه Dashboard. Header فعلی بج سبد را با عدد
واقعی صفر (نه ساختگی) نشان می‌دهد تا مدل Cart ساخته شود.

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

### Storefront Route/Page Standards (Master Workflow — بندهای ۱۹-۳۲)

استانداردهای اجباری زیر برای تمام صفحات/Routeهای Storefront برقرارند
(نه فقط Homepage)، اما طبق بند ۳۲ **یکجا برای کل Storefront پیاده
نمی‌شوند** — هنگام ساخت هر صفحه/ماژول به‌صورت متناسب همان بخش اضافه
می‌شود، طبق همان Workflow اصلی «Module → Implement → Test → Commit →
Push → STOP → Approval».

- **فایل‌های هر Route:** `page.tsx` (فقط Composition/Entry Point، بدون
  State غیرضروری) + `loading.tsx` (فقط اگر Route واقعاً Loading State
  دارد — Skeleton باید ساختار بصری واقعی همان صفحه را منعکس کند، نه
  Generic) + `error.tsx` (فقط اگر امکان خطای Runtime/Data Fetching
  دارد — بدون نمایش Stack Trace به کاربر، امکان Retry). `layout.tsx`
  فقط در صورت نیاز واقعی. `global-error.tsx`/`not-found.tsx` فقط اگر
  معماری فعلی Next.js لازمش کند.
- **Skeleton System:** Component های مشترک و Reusable
  (`ProductCardSkeleton`، `ProductGridSkeleton`, `HeroSkeleton`, ...)
  — نه بیش‌ازحد Generic؛ باید بدون Layout Shift و هماهنگ با UI واقعی
  باشند.
- **State Management:** Scope-based — UI محلی (Modal/Toggle/Carousel)
  با Local State، Server State (داده از Backend) با Server
  Components/Server-side Fetching تا حد امکان (نه قاطی با Client
  State)، Shared State (Cart/Favorites/Auth/Search/Filter) با یک
  معماری مشخص و متمرکز — نه پراکنده در Componentها. قبل از افزودن
  State Library جدید (Zustand/Redux/...) باید از کارفرما اجازه گرفته
  شود؛ فعلاً چنین Library ای در پروژه نیست.
- **Image Loading:** برای تصاویر اصلی (Product/Hero/Banner) الزامی
  است: Blur Placeholder قبل از نمایش تصویر کامل (Mesh Blur)، بدون
  Layout Shift (Aspect Ratio از ابتدا مشخص)، Transition نرم بعد از
  Load. یک Component استاندارد قابل استفاده مجدد (مثلاً
  `components/ui/optimized-image/`) باید این منطق را یک‌جا مدیریت
  کند — قبل از ساخت آن، بررسی شود که آیا از قبل چیزی مشابه وجود
  دارد (فعلاً وجود ندارد).
- **Accessibility:** Alt مناسب، `aria-label` لازم، Keyboard
  Navigation، Focus State، Contrast، Touch Target مناسب موبایل؛
  Skeleton نباید محتوای غیرضروری برای Screen Reader بسازد.

**وضعیت فعلی:** Mobile Bottom Bar (Phase ۱) یک Component ثابت بدون
Data Fetching/State پیچیده است، پس نیازی به `loading.tsx`/`error.tsx`
اختصاصی نداشت. این استانداردها از Phase ۲ به بعد (بخصوص جایی که
Fetch واقعی داده وجود دارد: Hero Slider، Product Carousels) رعایت
خواهند شد.

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
| jalaali-js | 2.0.1 | تبدیل تقویم شمسی↔میلادی (بدون وابستگی React) |

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
      settings/  page.tsx + colors/page.tsx + discounts/page.tsx + activity-log/page.tsx
                 + about-us/page.tsx + contact-us/page.tsx + faq/page.tsx
      orders/  page.tsx + new/ + [id]/page.tsx + loading.tsx + error.tsx
      discounts/  page.tsx
      amazing-offers/  page.tsx + new/ + [id]/edit/
      coupons/  page.tsx + new/ + [id]/edit/
      customers/  page.tsx + [id]/page.tsx
    (storefront)/               - حذف شد (نگاه کنید بخش «In Progress»)؛ از صفر ساخته می‌شود
    payment/result/page.tsx    - نتیجه پرداخت، Public (بدون Layout Dashboard)
    api/v1/
      auth/  otp/{request,verify}/route.ts, logout/route.ts
      users/  route.ts + [id]/route.ts + [id]/role/route.ts + [id]/status/route.ts
      categories/  route.ts + [id]/route.ts
      products/  route.ts + [id]/route.ts
      colors/  route.ts + [id]/route.ts
      orders/  route.ts + [id]/route.ts + [id]/status/route.ts
      amazing-offers/  route.ts + [id]/route.ts
      coupons/  route.ts + [id]/route.ts + validate/route.ts + check-code/route.ts
      discount-settings/  route.ts
      activity-log/  route.ts (فقط خواندنی)
      customers/  route.ts + [id]/route.ts + find-or-create/route.ts
      payments/  initiate/route.ts + callback/route.ts (Public)
      uploads/sign/route.ts
    login/page.tsx
    layout.tsx, page.tsx, globals.css
  components/
    ui/         - Button, Card, Badge, Input, Textarea, Combobox, Table,
                  Pagination, Skeleton, EmptyState, ErrorState, ConfirmDialog,
                  JalaliDatePicker, JalaliDateTimePicker
    dashboard/  - DashboardShell, KpiCard, charts, ...
    users/      - RoleBadge, UserStatusBadge, users-page-client, ...
    categories/ - CategoriesTree, CategoryForm
    products/   - ProductForm, ProductImageUploader, ImageCropModal,
                  VariantEditor, TechnicalSpecsEditor, ProductStatusBadge,
                  products-page-client
    settings/   - ColorsManager, ColorFormModal, DiscountSettingsForm,
                  ActivityLogPageClient, SocialLinksForm, ProvincesCitiesManager,
                  AboutUsForm, ContactUsForm, FaqManager, FaqFormModal
    orders/     - OrderForm, OrderItemsPicker, OrderDetailCard,
                  OrderStatusBadge, PaymentPanel, PaymentStatusBadge,
                  orders-page-client
    addresses/  - ProvinceCitySelect
    maps/       - NeshanMapPicker
    amazing-offers/ - AmazingOfferForm, AmazingOfferStatusBadge,
                  AmazingOfferCountdown, amazing-offers-page-client
    discounts/  - discounts-page-client (فقط خواندنی)
    coupons/    - CouponForm, CouponStatusBadge, CouponCodeGenerator,
                  coupons-page-client
    customers/  - customers-page-client, CustomerDetailCard, WalletManager
    auth/       - OtpLoginForm
    storefront/ - حذف شد (StorefrontHeader/StorefrontSearchBar قبلی)
  config/env.ts
  fonts/index.ts
  lib/
    auth/       session.ts, otp.ts, current-user.ts, api-guard.ts
    cloudinary/ config.ts (server-only — signed uploads, secret never in client)
    db/         connect.ts
    constants/  rbac.ts, dashboard-nav.ts
    sms/        send-otp-sms.ts, send-order-status-sms.ts
    payment/    zarinpal.ts (server-only — merchant secret never in client),
                initiate-order-payment.ts (initiateOrderPayment — پرداخت ترکیبی Wallet+درگاه)
    orders/     create-order.ts (createOrder — منطق مشترک Dashboard + Checkout)
    audit/      log-activity.ts (Best-effort — مثل الگوی پیامک سفارش)
    discounts/  engine.ts, validate-coupon.ts, redeem-coupon.ts,
                generate-coupon-code.ts
    cart/       recompute-cart-item.ts (تابع خالص قیمت‌گذاری/در‌دسترس‌بودن),
                cart-service.ts (recalculateCart, applyCouponToCart, serializeCart)
    wallet/     check-wallet-adjustment.ts (تابع خالص), wallet-service.ts
                (adjustWalletBalance — Atomic با findOneAndUpdate+$inc)
    products/   resolve-categories.ts (resolveProductCategories — جایگزین امن populate("category")
                در برابر category خراب در DB؛ نگاه کنید Known Issues)
    import/     parse-excel.ts, validate-province-city-rows.ts (تابع خالص),
                import-provinces-cities.ts
    neshan/     config.ts (NEXT_PUBLIC_NESHAN_API_KEY + آدرس‌های پایه API)
    utils/      api-response.ts, cn.ts, format.ts, slugify.ts,
                pricing.ts, image-crop.ts, amazing-offer.ts, jalali.ts
    validations/ auth.ts, users.ts, categories.ts, category-depth.ts, products.ts,
                amazing-offers.ts, customers.ts, payments.ts, coupons.ts,
                discount-settings.ts, social-links.ts, cart.ts, wallet.ts,
                about-us.ts, contact-us.ts, faqs.ts
    mock/       dashboard.ts (فقط همین باقی مانده Mock)
  models/       SocialLinks.ts, Province.ts, City.ts, Cart.ts, Wallet.ts,
                WalletTransaction.ts, WalletTopup.ts, WithdrawalRequest.ts,
                User.ts, Otp.ts, SystemFlag.ts, Category.ts, Product.ts,
                Color.ts, Order.ts, Counter.ts, AmazingOffer.ts, Payment.ts,
                Coupon.ts, CouponRedemption.ts, DiscountSettings.ts,
                ActivityLog.ts, AboutUs.ts, ContactUs.ts, Faq.ts
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
آدرس/کدپستی)، `subtotal`، `shippingCost`، `discount` (Snapshot —
جزئیات زیر)، `totalAmount` (= `subtotal + shippingCost -
discount.amount`، هرگز منفی)،
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

### Payment
`order` (ref Order)، `amount` (تومان — فقط سهم آنلاین قابل‌جمع‌آوری،
نه همیشه `Order.totalAmount`)، `provider` (فعلاً فقط `zarinpal`، اما
Enum باز برای افزودن Gatewayهای دیگر بعداً)، `status`
(`pending`/`processing`/`paid`/`failed`/`cancelled`/`refunded`/
`partially_paid` — دقیقاً enum بند ۳۱)، `authority` (شناسه تراکنش
زرین‌پال، unique — مانع دو Payment با یک Authority)، `refId` (فقط بعد
از تأیید موفق)، `cardPan`، `description`، `initiatedBy` (کارمند/ادمینی
که لینک را ساخته)، `paidAt`، `failureReason`.

هر سفارش می‌تواند چند رکورد `Payment` داشته باشد (هر تلاش پرداخت یک
رکورد؛ اگر یک لینک هنوز `pending`/`processing` باشد، به‌جای رکورد
جدید همان لینک بازگردانده می‌شود). مبلغ واقعی «پرداخت‌شده» یک سفارش با
جمع `amount` رکوردهای `paid` محاسبه می‌شود، نه یک فیلد جداگانه — دو
منبع حقیقت برای همان عدد ساخته نمی‌شود.

`src/lib/payment/zarinpal.ts` تنها نقطه تماس با API زرین‌پال است (v4،
`currency: "IRT"` چون کل پروژه با تومان کار می‌کند). آدرس‌های
Sandbox/Production فقط از `env.ZARINPAL_MODE` مشتق می‌شوند. مسیر
`GET /api/v1/payments/callback` عمداً بدون Auth Guard است — مرورگر
مشتری (نه کارمند لاگین‌شده در Dashboard) به آن هدایت می‌شود — و مبلغ
Verify همیشه از رکورد ذخیره‌شده `Payment.amount` خوانده می‌شود، هرگز
از Query String که قابل‌دستکاری توسط کاربر است. موفقیت پرداخت وضعیت
`Order.status` را خودکار تغییر نمی‌دهد؛ آن State Machine یک تصمیم
آگاهانه ادمین در Dashboard می‌ماند.

### Bank
مرجع بانک‌ها برای انتخاب هنگام ثبت چک (و آماده برای استفاده مجدد در
حساب‌های بانکی فروشگاه در Phase ۲): `name` (unique)، `logoUrl`/
`logoPublicId` (اختیاری، Cloudinary)، `isActive`، `sortOrder`. بدون
DELETE — چک‌های قدیمی ممکن است به یک بانک ارجاع داشته باشند؛
غیرفعال‌سازی جایگزین حذف است.

### Check
`bank` (ref Bank)، `issuer` (نام/نام‌خانوادگی/کدملی — Subdocument
`_id: false`)، `receiver` (ref User، محدود در API به
role=admin|super_admin)، `guarantor` (اختیاری، همان شکل issuer اما
کدملی اختیاری)، `phoneNumber`، `receivedDate`/`dueDate` (Date —
سررسید باید >= دریافت)، `amount` (Number، تومان)، `checkSeries`/
`checkNumber` (هر دو حداکثر ۶ رقم)، `sayadiId` (دقیقاً ۱۶ رقم)،
`status` (enum قابل توسعه — `src/lib/constants/check-status.ts`؛ فقط
`not_registered`/`registered`/`returned`/`transferred` در Phase ۱
فعال‌اند، بقیه — `pending_collection`/`collected`/`bounced`/`voided` —
برای Phaseهای بعدی رزرو شده‌اند)، `transferredTo`، `returnInfo`
(`returnedAt`, `returnedToName`, `returnedToNationalId`, `reason`)،
`createdBy` (ref User).

عمداً بدون فیلد ارجاع به `Order` — طبق Master Prompt این ارتباط باید
از طریق `Payment` برقرار شود (Phase ۲: یک `Payment` از نوع «چک» به
`Check` اشاره می‌کند)، نه اینکه `Check` مستقیماً بداند به کدام سفارش
تعلق دارد؛ این باعث می‌شود `Check` یک Entity مستقل و قابل‌استفاده‌ی
مجدد بماند. بدون API حذف — عودت/انتقال Status را تغییر می‌دهند و در
`returnInfo`/`transferredTo` ثبت می‌شوند، رکورد هرگز پاک نمی‌شود.
منطق مجازبودن عودت/انتقال (`canReturnCheck`/`canTransferCheck` در
همان فایل Status) هر دو فقط روی وضعیت `registered` اجازه می‌دهند.

### ActivityLog
Append-only (بند ۵۳). `actor` (ref User)، `actorName` (Snapshot —
عمداً Populate زنده نیست، تا اگر کاربر بعداً نامش را عوض کرد یا حذف
شد، متن لاگ همچنان خوانا بماند)، `action` (رشته آزاد مثل
`"user.role_changed"`)، `targetType`، `targetId`، `description` (جمله
آماده فارسی برای نمایش)، `createdAt`. بدون فیلد `updatedAt` و بدون
API ویرایش/حذف — یک Audit Trail واقعی باید غیرقابل‌دستکاری بماند.
ثبت آن (`src/lib/audit/log-activity.ts`) کاملاً Best-effort است،
دقیقاً با همان الگوی پیامک وضعیت سفارش: اگر نوشتن لاگ شکست بخورد،
عملیات حساس اصلی (که لاگ قرار بود آن را ثبت کند) هرگز متوقف یا
Rollback نمی‌شود.

**Planned models:** Address (فعلاً به‌صورت Embedded داخل Order است؛
Address Book مستقل مشتری بخشی از Storefront/Account است).

### Coupon
Entity کاملاً مستقل (نه فیلد داخل Product/Order — طبق تأکید صریح
Master Prompt بند ۲۵). `code` (یکتا، همیشه Uppercase ذخیره می‌شود)،
`discountPercentage`، `maxDiscountAmount` (`null` = بدون سقف —
عمداً `null` نه `0`، تا «بدون محدودیت» با «سقف صفر» اشتباه نشود)،
`minOrderAmount`، `startsAt` (اختیاری) و `expiresAt`، `status`
(`active`/`inactive`)، `type` (`public`/`private`)، `allowedUsers[]`
(ref User، فقط برای Private معنا دارد)، `usageLimit` (`null` =
نامحدود)، `usedCount`، `perUserLimit` (`null` = نامحدود).

### CouponRedemption
یک رکورد به‌ازای هر استفاده موفق: `coupon`، `user`، `order` (Unique —
یک سفارش هرگز نمی‌تواند دو رکورد Redemption داشته باشد)،
`discountAmount`، `createdAt`. جدا از `Coupon.usedCount` نگه داشته
می‌شود چون محدودیت هر کاربر (`perUserLimit`) نیاز به شمارش رکوردهای
مخصوص همان کاربر دارد که یک شمارنده سراسری روی خود Coupon نمی‌تواند
جواب بدهد.

**رزرو اتمیک ظرفیت (بند ۲۸ — جلوگیری از Race Condition):**
`reserveCouponUsage()` در `src/lib/discounts/redeem-coupon.ts` با یک
`findOneAndUpdate` تک‌مرحله‌ای که شرط `usedCount < usageLimit` را در
همان Query می‌گنجاند، ظرفیت را رزرو می‌کند — اگر دو درخواست همزمان به
آخرین ظرفیت برسند، فقط یکی از آن‌ها سند را Match و آپدیت می‌کند،
دیگری `null` می‌گیرد و رد می‌شود؛ به همین دلیل «شمارش سپس افزایش» در
دو Query جدا هرگز استفاده نشده. اگر ساخت Order بعد از رزرو موفق شکست
بخورد، `releaseCouponReservation()` جبران می‌کند (کم کردن `usedCount`)
تا ظرفیت محدود یک Coupon هرگز به‌خاطر یک سفارش ناموفق هدر نرود.
محدودیت هر کاربر (`perUserLimit`) فقط یک‌بار، قبل از رزرو، بررسی
می‌شود (نه داخل یک Transaction) — چون در معماری فعلی سفارش‌ها فقط
توسط کارمند و به‌صورت یکی‌یکی از Dashboard ساخته می‌شوند (نه Storefront
عمومی هم‌زمان)؛ این محدودیت در Known Issues ثبت شده و باید قبل از
باز شدن Coupon به Storefront بازبینی شود.

### DiscountSettings (Singleton)
یک سند با `_id` ثابت (`"discount-settings"`)، ساخته‌شده Atomic توسط
`getDiscountSettings()` (`findOneAndUpdate` + `upsert`، نه
find-then-create، تا دو درخواست همزمان اول هرگز دو سند نسازند).
فیلدها: `onlinePaymentRewardEnabled/Percentage`،
`mixedPaymentRewardEnabled/Percentage` (بند ۳۸).

### Order.discount (Snapshot)
`source` (`"coupon"` | `"payment_reward"`)، `amount`،
`discountPercentage`، `coupon` (ref Coupon، `null` برای Reward)،
`couponCode` (`null` برای Reward)، `rewardType` (`"online"` |
`"mixed"`، `null` برای Coupon). این یک Snapshot است نه Reference زنده
(بند ۳۱) — اگر Coupon بعداً ویرایش یا حذف شود، سابقه سفارش‌های قبلی
تغییر نمی‌کند.

**موتور محاسبه متمرکز** (`src/lib/discounts/engine.ts`, بند ۴۲):
`computeCouponDiscount()`, `computePaymentReward()`, و
`resolveOrderDiscount()` تنها جایی هستند که ریاضی تخفیف انجام
می‌شود؛ هیچ API یا Component دیگری این محاسبه را تکرار نمی‌کند.
اعتبارسنجی شرایط Coupon (بند ۲۷) در `validate-coupon.ts` عمداً یک
تابع خالص است که یک Coupon از قبل Fetch‌شده و یک شمارش از‌قبل‌انجام‌شده
می‌گیرد، نه اینکه خودش با DB کار کند — این جداسازی باعث شد تمام
حالت‌های بند ۴۵ (منقضی/غیرفعال/Private غیرمجاز/سقف مصرف/...) بدون
راه‌اندازی MongoDB قابل تست باشند (`validate-coupon.test.ts`).

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

### Storefront Design Tokens (جدا از Dashboard)

Storefront یک ست Token کاملاً مستقل دارد (`--sf-*` در
`src/app/globals.css`, داخل کلاس `.storefront` که در
`(storefront)/layout.tsx` اعمال می‌شود) — Token های Dashboard
(`--color-primary` ایندیگو و بقیه) دست‌نخورده باقی می‌مانند (بخش
«Do Not Change» زیر).

پالت (بر اساس رفرنس رنگی کاربر، navy/blue):
- `--sf-accent: #499bed` — دکمه اصلی/بج/حالت فعال
- `--sf-accent-hover: #3a86d6`
- `--sf-accent-soft: #daeaff` — پس‌زمینه ملایم/Hover
- `--sf-accent-light: #a1c6f6`
- `--sf-ink: #031725` — متن/عناصر خیلی پررنگ
- `--sf-ink-soft: #022e5b` — کارت «درباره ما» و مشابه

Component های Storefront باید از این Variableها با کلاس‌های
Arbitrary-value Tailwind استفاده کنند (مثل `bg-[var(--sf-accent)]`)،
هرگز از `bg-primary` که مخصوص Dashboard است.

اسکرین‌شات‌های رفرنس بصری (persboy.ir — یک فروشگاه میوه/سبزیجات) فقط
برای **ساختار Layout** استفاده شدند (چیدمان Header، جای جستجو، نحوه
اسلایدر/کارت‌ها) نه سبک بصری — طبق تأکید صریح بند ۳۶ Master Prompt
("Do NOT make it look like a fruit/vegetable store")، رنگ سبز آن‌ها
عمداً با پالت navy/blue بالا جایگزین شد.

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

**📱 بازطراحی کامل جدول‌های Dashboard برای موبایل (بدون اسکرول
افقی):** طبق درخواست صریح کارفرما («اکثراً با موبایل به داشبورد سر
می‌زنم»)، کامپوننت مرکزی `Table` (`src/components/ui/table.tsx`)
بازطراحی شد به‌جای این‌که هر صفحه جداگانه یک نسخه موبایل بسازد:
- `TableCell` دو Prop جدید گرفت: `label` (عنوان ستون، برای نمایش
  «برچسب: مقدار» روی موبایل) و `mobileVariant`
  (`"title"`/`"actions"`/`"hidden"`/پیش‌فرض `"row"`).
- در `globals.css`، زیر ۶۴۰px (`sm`)، هر `<tr>` با CSS خالص (بدون
  JS/بدون خطر Hydration Mismatch) به یک Card مستقل تبدیل می‌شود؛
  `thead` مخفی می‌شود چون هر مقدار برچسب خودش را کنارش دارد.
  ستون اول هر جدول (`mobileVariant="title"`) به‌صورت سرستون کارت
  نمایش داده می‌شود؛ ستون عملیات (`mobileVariant="actions"`) به یک
  ردیف دکمه در پایین کارت تبدیل می‌شود.
- تمام ۱۱ فایل مصرف‌کننده این کامپوننت (محصولات، سفارش‌ها، کاربران،
  مشتریان، کدهای تخفیف، تخفیف‌ها، شگفت‌انگیزها، جزئیات سفارش/مشتری،
  انتخاب اقلام سفارش، سفارش‌های اخیر Dashboard) به‌روزرسانی شدند —
  همه `min-w-[...]`های اجباری قبلی (که دقیقاً علت اسکرول افقی
  گزارش‌شده بودند) حذف شدند.
- **چرا CSS خالص به‌جای یک کامپوننت Card جداگانه برای موبایل:** یک
  کامپوننت مجزا یعنی دو بار Render کردن هر ردیف (یک نسخه Table، یک
  نسخه Card) که هم دو برابر کد نگه‌داری می‌شود هم خطر ناهماهنگی داده
  بین دو نسخه دارد. روش CSS-Driven یعنی دقیقاً همان JSX/همان داده،
  فقط ظاهرش با Media Query عوض می‌شود — با یک تغییر مکانیکی و کم‌ریسک
  (`label`+`mobileVariant`) در هر فایل، نه بازنویسی کامل هر جدول.

**📱 اصلاحات تکمیلی روی طرح موبایل جدول‌ها (طبق بازخورد مستقیم با
اسکرین‌شات از `/dashboard/users`):**
- **حذف «کانتینر» بیرونی:** یک `TableCard` جدید اضافه شد
  (`src/components/ui/table.tsx`) — دقیقاً مثل `Card` روی دسکتاپ، اما
  روی موبایل بدون حاشیه/پس‌زمینه/گردی (`max-sm:border-0
  max-sm:bg-transparent max-sm:rounded-none`). قبلاً `Card` معمولی
  همه کارت‌های تک‌ردیفی را در یک قاب بزرگ دیگر می‌پیچید که به آن
  «کانتینر» اضافه گفته می‌شد؛ الان فقط خود کارت‌های تک‌ردیفی حاشیه
  دارند. تمام ۷ صفحه لیست اصلی (محصولات، سفارش‌ها، کاربران، مشتریان،
  کدهای تخفیف، تخفیف‌ها، شگفت‌انگیزها) از `Card` به `TableCard`
  مهاجرت کردند.
- **راست‌چین اجباری روی موبایل:** چون کلاس پیش‌فرض `text-center` روی
  `TableCell` برای دسکتاپ لازم بود (نباید عوض می‌شد)، به‌جای حذفش یک
  Override با `text-align: right !important` داخل همان Media Query
  موبایل در `globals.css` اضافه شد — هم سرستون کارت (`title`) هم هر
  ردیف «برچسب: مقدار».
- **چیدمان Grid دو-ستونی ۲:۳ به‌جای Flex `space-between`:** قبلاً
  برچسب راست و مقدار با `justify-content: space-between` به لبه
  مقابل (چپ) چسبانده می‌شد — دقیقاً همان چیزی که در اسکرین‌شات باعث
  می‌شد Badge ها در گوشه دور از برچسبشان بیفتند. حالا هر `<td>` یک
  Grid با `grid-template-columns: 2fr 3fr` و `justify-items: start`
  است؛ ستون برچسب ۲ واحد، ستون مقدار ۳ واحد (روی ۵ واحد فرضی)، و
  مقدار بلافاصله بعد از برچسب می‌آید، نه در لبه مقابل.
- **کل کارت = لینک:** `TableRow` یک Prop اختیاری `href` گرفت؛ اگر
  داده شود، با `useRouter().push(href)` کل ردیف/کارت کلیک‌پذیر
  می‌شود (نه فقط متن عنوان). چون `table.tsx` حالا از هوک React
  استفاده می‌کند، `"use client"` به بالای فایل اضافه شد. دکمه‌های
  عملیات داخل هر ردیف (ویرایش/حذف) و Linkهای داخلی عنوان همگی
  `stopPropagation` صدا می‌زنند تا کلیک رویشان باعث Navigate دوباره
  توسط کل ردیف نشود.
- **اعداد فارسی برای شماره موبایل در همه‌جا:** لیست کاربران، لیست
  مشتریان، صف بررسی درخواست‌های برداشت، و تاریخچه تراکنش کیف پول —
  همه با `toPersianDigits` اصلاح شدند (قبلاً بعضی‌جا با `dir="ltr"` و
  ارقام لاتین نمایش داده می‌شدند).

**📱 اصلاحات تکمیلی دوم روی کارت موبایل محصولات:**
- **قیمت/موجودی هر Variant جداگانه (نه یک عدد تجمیعی):** طبق تصمیم
  صریح کارفرما («کارت جدا برای هر Variant» را رد کرد، «نمایش
  تفکیکی داخل همان کارت» را ترجیح داد). `GET /api/v1/products` حالا
  یک فیلد `variants` هم برمی‌گرداند (`{id, label, price, stock,
  isActive}` به ازای هر Variant) — بدون هیچ Query اضافه، چون
  `unit`/`attributes` از قبل داخل خود سند Product Embed شده‌اند. در
  کارت موبایل، زیر عنوان محصول یک فهرست کوچک از همه Variantها با
  قیمت/موجودی هرکدام نمایش داده می‌شود (`sm:hidden` — فقط موبایل)؛
  ستون‌های قدیمی «Variantها»/«شروع قیمت»/«موجودی» (که اعداد
  تجمیعی بودند) روی موبایل مخفی شدند (`mobileVariant="hidden"`) چون
  دیگر با فهرست تفکیکی جدید تکراری بودند. دسکتاپ بدون تغییر ماند.
- **دکمه‌های ویرایش/حذف واقعی روی موبایل، نه فقط آیکون:** چون همان
  JSX هم برای دسکتاپ (فشرده) هم موبایل (کارت) استفاده می‌شود، هر
  Cell عملیات الان دو نسخه دارد — یکی `hidden sm:flex` (دسکتاپ:
  آیکون کوچک، مثل قبل) و یکی `flex sm:hidden` (موبایل: دو دکمه
  تمام‌عرض با آیکون+متن از کامپوننت مشترک `Button`، `variant="secondary"`
  برای ویرایش و `variant="danger"` برای حذف). این تغییر روی هر ۳
  صفحه‌ای که جفت ویرایش/حذف دارند اعمال شد (محصولات، کدهای تخفیف،
  شگفت‌انگیزها) تا یکدست بماند، نه فقط محصولات.

**🔴 باگ بحرانی رفع‌شده — کل صفحه محصولات Crash می‌کرد (فیلد
`attributes` روی محصولات قدیمی):** درست بعد از اضافه‌شدن فیلد
`variants` به `GET /api/v1/products` (برای نمایش تفکیکی هر Variant
در کارت موبایل)، کل صفحه `/dashboard/products` با «خطایی رخ داد» از
کار افتاد — نه فقط روی موبایل، کل درخواست لیست. علت: کد
`v.attributes.map(...)` را بدون محافظت صدا می‌زد، اما فیلد
`attributes` در Schema با `default: []` تعریف شده — این Default فقط
موقع *ساخت* سند جدید اعمال می‌شود، نه روی سندهای قدیمی‌تری که از قبل
در MongoDB بودند (اگر این فیلد بعداً به Schema اضافه شده باشد).
برای هر محصول قدیمی که این فیلد را نداشت، `.map()` روی `undefined`
یک خطای سرور می‌انداخت — و چون این همه در یک حلقه `Array.map` روی
*تمام* محصولات آن صفحه اجرا می‌شد، یک محصول قدیمی کافی بود تا کل
Response آن صفحه (نه فقط همان محصول) خراب شود. دقیقاً همان الگوی باگ
`role` کاربران قدیمی که قبلاً در `RoleBadge` رفع شد — درسِ کلی: هر
فیلدی که با `default` در Schema تعریف شده اما ممکن است روی سندهای
قدیمی‌تر (پیش از افزودن آن فیلد) در DB واقعی وجود نداشته باشد، باید
همیشه با `?? []`/`?? 0`/مقدار پیش‌فرض مشابه در کد خوانده شود، نه با
فرض اینکه Schema Default تضمین می‌کند مقدار همیشه موجود است.
رفع شد: `(v.attributes ?? [])`، `v.discountPercent ?? 0`،
`v.discountAmount ?? 0`، `v.stock ?? 0`، `v.isActive ?? true`.
همین محافظت به‌صورت پیشگیرانه به تمام نقاط دیگری که مستقیماً
`attributes` را از یک Variant زنده می‌خواندند هم اضافه شد (نه فقط
جایی که همین الان Crash کرده بود): `amazing-offers` API،
`products/[id]` API، `create-order.ts` (سرویس مشترک ایجاد سفارش)،
`order-detail-card.tsx`، و `order-items-picker.tsx` — چون همه این‌ها
دقیقاً همان ریسک را داشتند (فقط هنوز به یک محصول قدیمی بدون این فیلد
برنخورده بودند).

**🔴 باگ بحرانی رفع‌شده — کل صفحه محصولات باز هم Crash می‌کرد
(این‌بار به دلیل واقعاً عمیق‌تر — `category` خراب در DB واقعی):**
بعد از رفع باگ `attributes`، خطای دیگری با همان الگو (یک محصول خراب،
کل لیست را می‌شکند) گزارش شد: `CastError: Cast to ObjectId failed
for value "vegetable"`. یعنی حداقل یک سند Product واقعی در MongoDB
مقدار `category` را به‌صورت رشته متنی `"vegetable"` دارد، نه یک
ObjectId معتبر — به‌احتمال زیاد باقیمانده‌ای از داده تستی اولیه پروژه
(طبق یادداشت این فایل: «Layout reference: persboy.ir (fruit/vegetable
store)» که فقط قرار بود برای الگوی چیدمان استفاده شود، نه داده واقعی).
علت فنی: `Product.paginate(..., { populate: { path: "category" } })`
هنگام Populate کردن، سعی می‌کند شناسه‌های `category` همه نتایج را با
هم به ObjectId تبدیل کند (`Category.find({_id: {$in: [...]}})`)؛
یک رشته نامعتبر در همین آرایه، کل Cast را می‌شکند و **کل درخواست** را
Crash می‌کند، نه فقط همان یک محصول.
**رفع ساختاری (نه فقط پاک‌کردن آن یک رکورد خراب):** یک تابع مشترک
جدید ساخته شد — `src/lib/products/resolve-categories.ts`
(`resolveProductCategories`) — که به‌جای `populate()`، ابتدا فقط
شناسه‌های *واقعاً معتبر* ObjectId را جدا می‌کند، فقط همان‌ها را از
Category می‌خواند، و برای هر محصول Category را دستی وصل می‌کند؛ یک
شناسه خراب فقط باعث می‌شود همان محصول `category: null` نشان داده
شود، نه اینکه کل لیست از کار بیفتد. این جایگزین `populate("category")`
در هر ۳ Route‌ای شد که این کار را می‌کردند: `GET /api/v1/products`،
`GET /api/v1/products/latest`، `GET /api/v1/products/best-discounts`
(بقیه Routeهای Storefront مثل `best-selling`/`amazing-offers` قبلاً
از Aggregation `$lookup` استفاده می‌کردند که اصلاً چنین Castی انجام
نمی‌دهد، پس در معرض این باگ نبودند).
**⚠️ نکته باقی‌مانده:** خود رکورد خراب (`category: "vegetable"`) در
DB واقعی هنوز پاک نشده — با این رفع، دیگر آن محصول باعث Crash نمی‌شود
اما در لیست‌ها با «بدون دسته‌بندی» (`category: null`) نمایش داده
می‌شود. برای پاک‌سازی خود داده، باید مستقیماً به MongoDB متصل شد (که
این Session به آن دسترسی ندارد)؛ اگر کاربر بخواهد، می‌توان یک
Script/Endpoint یک‌بارمصرف برای پیدا/اصلاح این‌گونه رکوردها نوشت.
**درس کلی‌تر:** هر Route‌ای که `populate()` روی یک فیلد Reference
انجام می‌دهد، در برابر داده خراب/قدیمی در همان فیلد آسیب‌پذیر است؛
برای فیلدهایی که ریسک داده خراب دارند (به‌خصوص در پروژه‌هایی با
سابقه داده تستی دستی)، Resolve دستی با فیلتر `isValidObjectId` امن‌تر
از تکیه بر Populate خام Mongoose است.

**🔴 باگ بحرانی رفع‌شده — Environment Variables در باندل Client:**
`src/lib/neshan/config.ts` (مصرف‌شده توسط کامپوننت Client
`NeshanMapPicker`) به‌اشتباه `env` را از `@/config/env` Import
می‌کرد. چون آن فایل کل Schema اعتبارسنجی متغیرهای *سرور* (شامل
`MONGODB_URI`, `AUTH_SECRET`, `CLOUDINARY_API_SECRET` و...) را هم در
بر دارد، این Import کل آن منطق را داخل باندل جاوااسکریپت مرورگر
می‌برد. در مرورگر `process.env` یک Object واقعی نیست (Next.js فقط
ارجاع‌های *مستقیم* مثل `process.env.NEXT_PUBLIC_X` را زمان Build
جایگزین می‌کند، نه یک خواندن کلی از `process.env`)، پس اعتبارسنجی
همیشه با «همه فیلدها undefined» شکست می‌خورد — این دقیقاً همان خطای
«Invalid environment variables» بود که در `/dashboard/orders/new`
دیده شد؛ **هیچ ربطی به تنظیمات Vercel نداشت.**
رفع شد: `neshan/config.ts` اکنون مستقیماً `process.env.NEXT_PUBLIC_NESHAN_API_KEY`
(یک ارجاع ادبی مستقیم، قابل Inline شدن توسط Next.js) می‌خواند، نه از
طریق ماژول مشترک `env.ts`. تأیید شد با بررسی مستقیم خروجی Build که
دیگر هیچ اثری از Secretهای سرور در باندل Client نیست.
**درس گرفته‌شده برای آینده:** هر فایلی که قرار است از یک کامپوننت
`"use client"` مصرف شود، هرگز نباید از `@/config/env` (که کل
Secretهای سرور را هم دارد) Import کند — حتی برای خواندن یک متغیر
`NEXT_PUBLIC_*`. باید مستقیم از `process.env.NEXT_PUBLIC_X` خواند.

| مرحله | تصمیم | دلیل |
|---|---|---|
| Social Links | `GET /api/v1/social-links` بدون `requireApiUser` (اولین Route عمومی پروژه) | Storefront آینده (فوتر) و Dashboard هر دو باید بتوانند بدون Session این را بخوانند؛ داده حساسیتی ندارد که نیاز به Auth داشته باشد |
| Social Links | ثابت `SOCIAL_PLATFORMS` به‌جای فیلد جدا برای هر شبکه در Schema | افزودن شبکه اجتماعی جدید (بند صریح سند Audit) باید فقط یک خط باشد، نه تغییر Schema/Route/UI هر بار |
| Province/City Import | Validation در تابع خالص جدا از Upsert در Mongo | امکان Unit Test کامل منطق تشخیص خطا/Duplicate بدون نیاز به DB واقعی یا فایل Excel واقعی |
| Province/City Import | تلاش برای Transaction با Fallback خودکار به غیر-Transactional | طبق سند («در صورت امکان») — روی Atlas (Replica Set) واقعی Transactional اجرا می‌شود؛ در محیط توسعه محلی (Standalone) کار متوقف نمی‌شود |
| Province/City API | `GET /api/v1/provinces` و `GET /api/v1/cities` بدون Auth | هم Dashboard هم Storefront آینده باید بتوانند این Dropdownها را بدون Session بخوانند |
| Neshan API Key | `NEXT_PUBLIC_NESHAN_API_KEY` (Client-side)، نه یک متغیر Server-only | ویجت نقشه ذاتاً در مرورگر Tile می‌گیرد؛ Proxy کردن هر Tile از سرور غیرعملی است (تأخیر/هزینه). مدل امنیتی Neshan دقیقاً برای همین با محدودیت Domain/Referrer در پنل طراحی شده، نه مخفی نگه‌داشتن Key |
| Address | یک Model `Address` مستقل ساخته نشد؛ فقط `Order.shippingAddress` با دو فیلد اختیاری Lat/Lng گسترش یافت | چون هنوز هیچ Address Book مستقلی (چند آدرس ذخیره‌شده per مشتری) در Scope نبود؛ ساخت یک Model زودتر از نیاز واقعی‌اش فقط پیچیدگی بی‌فایده اضافه می‌کرد — طبق قانون «از ایجاد Duplicate/Premature Abstraction خودداری کن» |
| Reverse Geocoding | مستقیماً از Client به `api.neshan.org` (نه از طریق Backend Proxy) | همان Key عمومی (Client-side) از قبل در دسترس مرورگر است؛ یک Proxy اضافه فقط یک Round-trip بی‌فایده به سرور خودمان اضافه می‌کرد بدون افزایش امنیت واقعی |
| Best-Discounts API | محاسبه درصد تخفیف مؤثر در Application، نه در Mongo Aggregation | تخفیف می‌تواند Percent یا Amount ثابت باشد؛ محاسبه دقیق «درصد مؤثر» به فرمول `computeFinalPrice` نیاز دارد که تکرارش در Aggregation Pipeline باعث Duplicate منطق و شکنندگی می‌شود |
| Best-Selling API | معیار در ثابت `EXCLUDED_STATUSES` (فقط `cancelled`/`returned` مستثنی) | سند صراحتاً خواسته «معیار باید مشخص و قابل توسعه باشد» — تغییر معیار در آینده (مثلاً بازه زمانی) فقط یک تغییر کوچک است |
| Cart | فقط Authenticated (بدون Guest Cart) | سیستم OTP از قبل برای هر شماره موبایل کار می‌کند (نقش پیش‌فرض `customer`)؛ توضیح کامل مسیر افزودن Guest در آینده در بخش Completed Features |
| Cart | `requireAuthenticatedUser` جدید به‌جای `requireApiUser` | نقش `customer` هیچ Permission ای در RBAC ندارد (RBAC فقط برای Dashboard طراحی شده بود)؛ Cart نیاز به «فقط Login باشد» دارد نه یک Permission خاص |
| Cart | بدون Inventory Reservation | دستور صریح سند: «صرفاً موجودی را رزرو نکن مگر معماری صراحتاً Reservation داشته باشد» — موجودی فقط لحظه Add/Update چک می‌شود |
| Cart Coupon | فقط ارجاع (`coupon`, `code`) Persist می‌شود، نه مبلغ تخفیف | مبلغ تخفیف باید هر بار از cartTotal تازه محاسبه شود، دقیقاً مثل قیمت هر Item |
| Cart Coupon | اعمال کد تخفیف روی Cart هرگز `usedCount`/`CouponRedemption` را تغییر نمی‌دهد | «استفاده واقعی» فقط لحظه ثبت سفارش واقعی است؛ وگرنه سبدهای رهاشده ظرفیت کد را هدر می‌دادند |
| Amazing Offer در Cart | فعلاً اعمال نشد | نحوه تعامل آن با تخفیف Variant/Coupon (اولویت/Exclusive) هنوز تصمیم‌گیری نشده؛ نیازمند تأیید جداگانه |
| Wallet | نسخه ساده (فقط تعدیل دستی ادمین، بدون درگاه پرداخت) | تصمیم صریح کارفرما — ساخت درگاه/Top-up خودکار توسط مشتری یک تصمیم/Task کاملاً جداست |
| Wallet Adjustment | Atomic با `findOneAndUpdate`+`$inc` (شرط موجودی کافی داخل خود Query) | تنها راه تضمینی جلوگیری از Race Condition بین دو تعدیل هم‌زمان روی یک کیف پول؛ چک جدا قبل از نوشتن هرگز کافی نیست |
| Wallet در Cart | ساخته نشد | Wallet به‌عنوان یک زیرسیستم کامل اصلاً وجود ندارد (طبق خود Phase 1 Audit)؛ ساختار عددی فعلی Cart مانع Payment Split آینده نیست، اما ساخت خود Wallet نیازمند تصمیم/تأیید جداگانه است |


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
| Customers | بدون مدل جدا — همان `User` با `role=customer`، لیست/جزئیات از طریق Aggregation با `orders` ($lookup) | Customer از ابتدا در User model جای گرفته بود (اولین کاربر Super Admin، بقیه پیش‌فرض Customer)؛ مدل جدا داده را دوپاره می‌کرد بدون فایده معماری |
| Customers | صفحه Customers فقط خواندنی (بدون تغییر نقش/فعال‌سازی) — لینک به همان صفحه Users موجود | آن قابلیت از قبل در User Management ساخته شده بود؛ تکرارش هم دو مسیر نوشتن برای یک داده می‌ساخت هم Authorization را دو جا نگه می‌داشت |
| Customers | `totalSpent` فقط از سفارش‌های واقعاً برگردانده‌شده (حداکثر ۲۰ سفارش اخیر) جمع می‌شود، با پرچم `partialTotalSpent` به UI | جمع زدن روی کل تاریخچه سفارش یک مشتری پرمعامله در API لیست هزینه محاسباتی داشت؛ عدد ناقص با برچسب صادقانه بهتر از عدد کامل ولی کند یا گمراه‌کننده بدون برچسب است |
| Payment | زرین‌پال انتخاب شد (رایج‌ترین درگاه ایرانی، مستندات API v4 پایدار) — راه‌اندازی فعلاً با Sandbox، تصمیم صریح کاربر بود | Merchant ID واقعی فقط بعد از احراز هویت کسب‌وکار صادر می‌شود؛ کد از اول برای سوییچ بدون تغییر طراحی شد (`ZARINPAL_MODE`) |
| Payment | مسیر Callback (`/api/v1/payments/callback`) عمداً بدون Auth Guard | مرورگری که به این مسیر می‌رسد مرورگر مشتری است، نه یک Session داشبورد؛ تنها مرجع اعتماد پاسخ Verify سمت سرور زرین‌پال است، نه هویت درخواست‌کننده |
| Payment | مبلغ Verify همیشه از `Payment.amount` ذخیره‌شده خوانده می‌شود، هرگز از Query String Callback | Query String کاملاً در اختیار مرورگر کاربر است؛ اعتماد به آن برای مبلغ یعنی امکان دستکاری مبلغ پرداختی توسط خود کاربر |
| Payment | موفقیت Callback باعث تغییر خودکار `Order.status` نمی‌شود | Order State Machine (`order-status.ts`) قرار بود یک تصمیم آگاهانه و Auditable ادمین بماند؛ آمیختن آن با یک Side Effect خودکار Webhook-مانند این ضمانت را می‌شکست — کارمند با دیدن پرداخت موفق در پنل، خودش وضعیت را عوض می‌کند |
| Payment | برای هر Order چند رکورد `Payment` مجاز است، ولی یک لینک `pending`/`processing` باز، به‌جای رکورد جدید بازگردانده می‌شود | جلوگیری از تکثیر Authorityهای زرین‌پال برای یک تلاش پرداخت که کارمند چندبار روی دکمه زده |
| Coupon (§41) | **Coupon و Automatic Payment Reward متقابلاً منحصر به فردند — تصمیم صریح کاربر.** هرکدام اول اعمال شود مانع دیگری می‌شود؛ چون هر دو در یک درخواست ساخت سفارش ارزیابی می‌شوند، Coupon همیشه «اول اعمال‌شده» تلقی می‌شود (اقدام آگاهانه) و Reward خودکار (اقدام غیرفعال) را بلوک می‌کند | مطابق یکی از ۴ سیاست مطرح‌شده در بند ۴۱؛ کاربر این گزینه را به‌جای ترکیب یا اولویت زنجیره‌ای انتخاب کرد |
| Coupon | `Order Eligible Amount` برای هم Coupon هم Payment Reward همیشه `subtotal` است (جمع اقلام)، نه `totalAmount` شامل هزینه ارسال | هزینه ارسال یک هزینه واقعی تحویل است نه بخشی از ارزش خرید؛ تخفیف روی آن اعمال نمی‌شود، مطابق تفسیر رایج «Order Eligible Amount» در بند ۲۹ |
| Coupon | Coupon Entity کاملاً مستقل با Model و API خودش، نه فیلد داخل Product/Order | تأکید صریح بند ۲۵؛ همچنین امکان گزارش‌گیری/مدیریت مستقل کدهای تخفیف بدون وابستگی به یک سفارش یا محصول خاص |
| Coupon | رزرو ظرفیت Coupon (`usedCount`) قبل از کسر موجودی Variant انجام می‌شود، نه بعد | اگر ظرفیت Coupon تمام شده باشد، سفارش اصلاً نباید موجودی را دست بزند؛ رد سریع بدون هیچ Side Effect بهتر از رد دیرهنگام بعد از یک تغییر قابل Rollback است |
| Coupon | حذف یک Coupon، سفارش‌های قبلی را دست‌نخورده می‌گذارد (Snapshot در `Order.discount`) ولی رکوردهای `CouponRedemption` را حذف نمی‌کند | تاریخچه مصرف (چه کسی، کِی) حتی بعد از حذف تعریف Coupon ارزش Audit دارد؛ فقط رفرنس `coupon` در آن رکوردها ممکن است در آینده Dangling شود که هرگز بدون بررسی وجود Dereference نمی‌شود |
| Storefront مرحله ۱ | Token های رنگی Storefront (`--sf-*`) کاملاً جدا از Dashboard، Scope‌شده با کلاس `.storefront` | Dashboard Token های Indigo را طبق «Do Not Change» دست‌نخورده نگه می‌دارد؛ دو Surface مشتری/ادمین هویت بصری متفاوت دارند |
| Storefront مرحله ۱ | `src/app/page.tsx` قدیمی (صفحه Placeholder «در حال ساخت») حذف و با `(storefront)/page.tsx` جایگزین شد | Route Group `(storefront)` هم به مسیر `/` نگاشت می‌شود؛ Next.js اجازه دو `page.tsx` هم‌مسیر را نمی‌دهد |
| Storefront مرحله ۱ | بج سبد خرید در Header فقط وقتی تعداد بزرگ‌تر از صفر باشد نمایش داده می‌شود؛ فعلاً همیشه ۰ (Cart هنوز نساخته شده) | بند ۵۲: هرگز عدد ساختگی سبد نشان داده نشود؛ صفر یک عدد واقعی و صادقانه است، نه Placeholder |
| Discount Settings | یک Singleton با `_id` ثابت به‌جای یک Collection عمومی Key-Value | فقط یک تنظیم با ۴ فیلد مرتبط هست؛ یک Document اختصاصی و Type-safe از یک الگوی Generic-تر برای این مورد ساده‌تر و امن‌تر است |
| Coupon UI | تاریخ شروع/انقضای Coupon با `JalaliDatePicker` سفارشی (سه Combobox روز/ماه/سال) پیاده‌سازی شد، نه یک Library آماده مثل `react-multi-date-picker` | نیاز فقط به انتخاب روز/ماه/سال بدون زمان بود؛ یک Component کوچک و کاملاً هم‌سو با Design Token های پروژه از اضافه‌کردن یک Dependency سنگین‌تر با ظاهر پیش‌فرض خودش ساده‌تر و سازگارتر بود |
| Coupon UI | تبدیل شمسی↔میلادی با `jalaali-js` (بدون UI/React) به‌جای یک پکیج Date-Picker همه‌کاره | جداسازی منطق تبدیل (تست‌پذیر، بدون DOM) از UI انتخاب تاریخ؛ سازگار با اصل «هر تکنولوژی باید دلیل داشته باشد» در بند ۷۹ |
| Coupon Code Generator | کد پیشنهادی همیشه از طریق `/api/v1/coupons/check-code` بررسی در‌دسترس بودن می‌شود، حتی برای پیشنهاد خودکار اول | جلوگیری از برخورد کد تکراری در همان لحظه پیشنهاد؛ اگر بررسی شبکه شکست بخورد، همچنان یک پیشنهاد برمی‌گرداند و اعتبارسنجی نهایی حین ثبت (۴۰۹) تضمین صحت می‌کند |
| Jalali Dates | دو Helper مجزا برای تبدیل شمسی: یکی لنگر UTC نیمه‌شب (Coupon — فقط «روز» مهم است)، یکی لنگر Local Time (Amazing Offer — لحظه دقیق Countdown مهم است) | اگر این دو در یک تابع ادغام می‌شدند، یکی از دو Use Case حتماً با Off-by-one-day یا جابه‌جایی ساعت اشتباه محاسبه می‌شد؛ نگه‌داشتن جدا آن‌ها خواناتر و مطمئن‌تر است |
| Activity Log | بدون API ویرایش یا حذف — فقط `POST` داخلی از طریق `logActivity()` و یک `GET` فقط‌خواندنی برای Dashboard | یک Audit Trail که قابل ویرایش باشد اصلاً Audit Trail نیست؛ نبود مسیر Update/Delete یک تصمیم امنیتی است نه صرفاً کمبود Feature |
| Activity Log | `actorName` در لحظه ثبت Snapshot می‌شود، نه با `populate` از User در لحظه نمایش خوانده می‌شود | یک لاگ باید همیشه بازتاب همان لحظه‌ای باشد که رویداد رخ داد؛ اگر کاربر بعداً تغییر نام داد یا حذف شد، لاگ‌های قدیمی نباید عقب‌گرد کنند یا خالی نمایش داده شوند |
| Activity Log | فقط رویدادهای صریحاً «حساس» طبق مثال‌های بند ۵۳ (نقش/وضعیت کاربر، وضعیت سفارش) به‌علاوه رویدادهای معادل در Featureهای بعدی (Coupon، Discount Settings، Amazing Offer) ثبت می‌شوند — نه هر Read/Write ساده مثل ساخت محصول یا رنگ | بند ۵۳ صراحتاً اجازه نسخه Minimal می‌دهد؛ ثبت همه‌چیز حجم لاگ را بی‌فایده زیاد می‌کرد بدون افزایش واقعی در قابلیت Audit برای عملیات واقعاً حساس |

## 14. Known Issues

- **رفع شد — باگ ورود مبلغ در فرم چک (ارقام فارسی در Input کنترل‌شده):**
  فیلد مبلغ مقدار نمایشی رو با `toPersianDigits` به ارقام فارسی
  تبدیل می‌کرد، اما تابع `digitsOnly` قدیمی فقط ارقام ASCII رو نگه
  می‌داشت؛ در نتیجه با هر رقم جدید، ارقام فارسیِ از قبل تایپ‌شده به‌کلی
  پاک می‌شدند. راه‌حل: `digitsOnly`/`toEnglishDigits` مشترک در
  `src/lib/utils/format.ts` که قبل از فیلتر کردن، ارقام فارسی/عربی رو
  به ASCII نرمال‌سازی می‌کند. **قاعده کلی برای آینده:** هر `<input>`ی
  که مقدارش را با ارقام فارسی نمایش می‌دهد ولی state داخلی‌اش رشته
  خام دیجیت است، باید از این `digitsOnly` مشترک استفاده کند، نه یک
  Regex محلی `[^0-9]`.
- **نمایش «نام (شماره تلفن)» به‌جای فقط یکی از آن دو:** تابع مشترک
  `formatPersonWithPhone` در `format.ts` اضافه شد و در لیست/جزئیات
  چک، AdminPicker، و ستون مشتری لیست سفارش‌ها استفاده می‌شود.
- **ویرایش نام کاربر:** `PATCH /api/v1/users/:id` (Permission
  `USERS_UPDATE`، بدون محدودیت خودویرایشی چون تغییر نام ارتقاء
  دسترسی نیست) + دکمه ویرایش در `UserDetailCard`.

- **پاک‌کردن ناقص دیتابیس باعث می‌شود اولین کاربر جدید Super Admin
  نشود:** منطق «اولین کاربر = Super Admin» (`claimFirstAdminSlot` در
  `src/models/SystemFlag.ts`) یک Flag اتمیک در Collection جداگانه‌ی
  `systemflags` (سند با `key: "firstAdminAssigned"`) ذخیره می‌کند تا
  از Race Condition جلوگیری کند. اگر فقط Collection `users` پاک شود
  ولی `systemflags` باقی بماند، ورود بعدی با OTP یک کاربر جدید با نقش
  `customer` می‌سازد (نه Super Admin) — چون Flag از قبل «Claim شده»
  است. علامت این مشکل دقیقاً همین است: ورود موفق است، اما بلافاصله از
  `/dashboard` به `/` ریدایرکت می‌شود (طبق `dashboard/layout.tsx`:
  `if (user.role === "customer") redirect("/")`). **راه‌حل:** یا نقش
  کاربر موردنظر را مستقیماً در Collection `users` به `super_admin`
  تغییر بده، یا برای ریست کامل، هر دو Collection `users` و
  `systemflags` را با هم پاک کن تا منطق اولین کاربر دوباره کار کند.
- **Address Book مستقل مشتری هنوز طراحی نشده:** فرم سفارش اکنون از
  Dropdown استان/شهر + نقشه استفاده می‌کند (Phase 5)، اما چند آدرس
  ذخیره‌شده به ازای هر مشتری (برای انتخاب سریع در Checkout آینده
  Storefront) هنوز یک Model/UI مستقل ندارد؛ باید هم‌زمان با Cart/Checkout
  طراحی شود.
- **Wallet هنوز درگاه پرداخت/Top-up خودکار ندارد:** فقط تعدیل دستی
  توسط ادمین (طبق تصمیم صریح کارفرما — نسخه ساده). اگر در آینده
  مشتری بخواهد خودش کیف پول را شارژ کند، آن یک تصمیم/Task کاملاً جدا
  (اتصال درگاه پرداخت واقعی) است.
- **Cart↔Wallet اکنون وصل است (به‌روزرسانی):** با ساخت `POST
  /api/v1/checkout`، پرداخت ترکیبی Wallet+درگاه اکنون از روی Cart
  واقعی هم در دسترس است (فلگ `useWallet` در Checkout). ورودی قدیمی
  این بخش (که می‌گفت «هنوز وصل نیست») منسوخ شد.
- **بدون API واقعی Payout خودکار:** درخواست‌های برداشت یک صف بررسی
  دستی‌اند — ادمین باید واریز واقعی (کارت‌به‌کارت یا پایا/ساتنا) را
  خودش خارج از سیستم انجام دهد و فقط نتیجه را در Dashboard ثبت کند.
  اتصال به یک API واقعی Payout (اگر چنین سرویسی در آینده تهیه شود)
  یک تصمیم/Task جداست.
- **بدون موتور محاسبه خودکار هزینه ارسال:** `POST /api/v1/checkout`
  و فرم سفارش Dashboard هر دو `shippingCost` را مستقیماً از ورودی
  می‌گیرند. Lat/Lng آدرس از Phase 5 ذخیره می‌شود، اما هنوز هیچ سرویسی
  از روی فاصله هزینه واقعی را حساب نمی‌کند.
- **Race Condition واقعی Checkout هنوز به‌صورت کامل تحت بار همزمان
  تست نشده:** کسر موجودی در `createOrder()` با `Product.updateOne`
  ساده انجام می‌شود (بدون شرط `stock >= quantity` در خود Query)؛ در
  عمل به دلیل چک قبلی همان تابع (`variant.stock < item.quantity`)
  ریسک پایینی دارد اما از نظر ساختاری، برخلاف `adjustWalletBalance`،
  کاملاً Atomic نیست. این رفتار همانی است که از قبل (پیش از این
  جلسه) در `POST /api/v1/orders` وجود داشت؛ Checkout جدید فقط از
  همان تابع استفاده مجدد کرد، آن را تغییر نداد. اگر در آینده Traffic
  همزمان واقعی روی یک Variant کم‌موجودی مطرح شد، باید به الگوی
  `findOneAndUpdate` با شرط داخل Query (مثل `adjustWalletBalance`)
  مهاجرت کند.
- **بدون Integration/API Test واقعی:** تست‌های پروژه (از ابتدا) فقط
  Unit Test روی توابع خالص/Zod Schema هستند. اگر در آینده تست خودکار
  Route‌های واقعی با یک DB واقعی لازم شد، باید زیرساخت جداگانه‌ای
  (مثلاً `mongodb-memory-server`) به‌عنوان یک Task مجزا راه‌اندازی
  شود.
- **بدون اعتبارسنجی سمت سرور «شهر متعلق به استان است»:** چون
  `Order.shippingAddress` نام ذخیره می‌کند نه ID، این کنترل فقط در
  UI (Dropdown وابسته `ProvinceCitySelect`) تضمین می‌شود؛ یک Client
  دستکاری‌شده می‌تواند تئوریاً ترکیب نامعتبر بفرستد.

- **مهم — محدودیت هر کاربر (`perUserLimit`) Coupon داخل یک
  Transaction نیست:** فقط یک‌بار قبل از رزرو ظرفیت بررسی می‌شود. در
  معماری فعلی (سفارش‌ها فقط توسط کارمند، یکی‌یکی، از Dashboard ساخته
  می‌شوند) این ریسک عملاً صفر است، اما قبل از این‌که Coupon به
  Checkout عمومی Storefront متصل شود (جایی که چند مرورگر همزمان
  می‌توانند سفارش بدهند)، باید این بخش با یک الگوی اتمیک‌تر (مثلاً
  Unique Index ترکیبی روی `{coupon, user}` وقتی `perUserLimit === 1`)
  بازبینی شود.
- اگر بعد از `claimFirstAdminSlot()` ساخت User شکست بخورد، پرچم
  قفل‌شده باقی می‌ماند و هیچ کاربری دیگر Super Admin نمی‌شود (نیاز به
  رفع دستی در دیتابیس). حالت بسیار نادر، برای سادگی فعلاً پذیرفته شده.
- **مهم — درگاه پرداخت فعلاً Sandbox است:** تا وقتی کاربر Merchant ID
  واقعی زرین‌پال را (بعد از احراز هویت کسب‌وکار در پنل zarinpal.com)
  در `ZARINPAL_MERCHANT_ID` قرار ندهد و `ZARINPAL_MODE=production`
  نشود، هیچ پرداخت واقعی/مالی از طریق لینک‌های ساخته‌شده انجام
  نمی‌شود — فقط تراکنش تست Sandbox.
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
- [ ] تست واقعی Customers روی Vercel (جستجو، Pagination، تعداد سفارش
  و مجموع خرید صحیح، صفحه جزئیات با تاریخچه سفارش‌ها)
- [ ] تست واقعی Payment روی Vercel با Sandbox زرین‌پال (ساخت لینک از
  صفحه سفارش، پرداخت تستی، بازگشت به `/payment/result`، ثبت صحیح
  `refId`/`cardPan`، رفتار Callback روی لغو کاربر)
- [ ] وقتی کاربر Merchant ID واقعی زرین‌پال را فرستاد: `ZARINPAL_MERCHANT_ID`
  و `ZARINPAL_MODE=production` را در Vercel تنظیم و یک تراکنش واقعی
  کم‌مبلغ تست کن
- [ ] تست واقعی Coupon روی Vercel (ساخت Coupon عمومی/خصوصی، اعمال در
  فرم سفارش، رد کد منقضی/غیرفعال/سقف مصرف/Private غیرمجاز، بررسی
  اینکه با فعال بودن Payment Reward هم‌زمان، Coupon همیشه برنده
  می‌شود، صفحه `/dashboard/settings/discounts`)
- [ ] پیش از اتصال Coupon به Checkout عمومی Storefront، محدودیت
  هر کاربر (`perUserLimit`) را به یک الگوی اتمیک‌تر ارتقا بده (بند
  Known Issues بالا)
- [ ] تست واقعی تقویم شمسی و Code Generator روی Vercel (ساخت Coupon
  با تاریخ شروع/انقضای شمسی، بررسی صحت تبدیل به تاریخ میلادی ذخیره‌شده،
  پیشنهاد خودکار کد در بدو باز شدن فرم، دکمه پیشنهاد مجدد)
- [ ] تست واقعی `JalaliDateTimePicker` روی Amazing Offer روی Vercel
  (ساخت Offer با ساعت/دقیقه شمسی، بررسی صحت لحظه Countdown نسبت به
  زمان واقعی سرور)
- [ ] تست واقعی Activity Log روی Vercel (تغییر نقش/وضعیت کاربر، تغییر
  وضعیت سفارش، عملیات Coupon/Amazing Offer/Discount Settings — هرکدام
  باید بلافاصله در `/dashboard/settings/activity-log` ظاهر شوند)
- [x] تصمیم درباره شروع Storefront — تأیید شد، در حال ساخت
- [ ] مرحله ۲ Storefront: HeroSlider — نیاز به مدل `Banner` جدید
  (تصویر، لینک، ترتیب، فعال/غیرفعال) که هنوز وجود ندارد؛ باید قبل از
  این مرحله ساخته شود
- [ ] یک بخش تنظیمات جدید در Dashboard برای مدیریت لینک‌های شبکه‌های
  اجتماعی (واتساپ بیزینس/تلگرام/اینستاگرام/روبیکا/ایتا) — کاربر گفته
  این‌ها باید از پنل مدیریت شوند، نه Environment Variable؛ فعلاً در
  Footer (مرحله ۷ Storefront) Placeholder گذاشته خواهد شد تا این
  بخش Settings ساخته شود
- [ ] مدل `Cart` (مهمان + کاربر لاگین‌شده) و `Favorite`/Wishlist —
  پیش‌نیاز مراحل بعدی Storefront (بج‌های واقعی Header، افزودن به
  سبد، علاقه‌مندی)

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
`ZARINPAL_MERCHANT_ID`, `ZARINPAL_MODE` (=sandbox پیش‌فرض)،
`NEXT_PUBLIC_APP_URL` (اختیاری — خودکار از VERCEL_URL)، `NODE_ENV`.

`SMS_IR_LINE_NUMBER` فعلاً فقط برای استفاده احتمالی آینده از متد Bulk
نگه داشته شده؛ OTP از آن استفاده نمی‌کند. هیچ مقدار واقعی Secret هرگز
نباید Commit شود (`.gitignore` با الگوی `.env*` + استثنای فایل‌های
`*.example`).

**مهم — سوییچ زرین‌پال به Production:** هیچ کد یا Deploy جدیدی لازم
نیست. فقط در Vercel → Settings → Environment Variables مقدار
`ZARINPAL_MERCHANT_ID` را به Merchant ID واقعی (بعد از احراز هویت
کسب‌وکار در پنل zarinpal.com) و `ZARINPAL_MODE` را به `production`
تغییر بده و یک Redeploy بزن.

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
