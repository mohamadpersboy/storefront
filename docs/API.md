# مستندات API — فرش سقطچی

این سند خروجی Phase 10 (Documentation) سند «بررسی تکمیل Backend و
Dashboard» است و APIهای ساخته‌شده در Phase 2 تا 8 را پوشش می‌دهد.
برای APIهای قدیمی‌تر (Auth، Users، Products، Categories، Orders،
Payments، Coupons، Amazing Offers Dashboard) به کد منبع مراجعه کنید؛
این سند فقط روی موارد جدید این جلسه تمرکز دارد.

قرارداد کلی پاسخ همه Routeها:

```json
// موفق
{ "success": true, "data": { ... }, "message": "..." }
// خطا
{ "success": false, "message": "...", "errors": { "field": ["..."] } }
```

---

## احراز هویت APIهای این سند

سه سطح دسترسی در این سند استفاده شده:

| سطح | یعنی چه | تابع Guard |
|---|---|---|
| **عمومی (بدون Auth)** | هرکسی، حتی بدون Login | ندارد |
| **هر کاربر Login‌شده** | نقش مهم نیست (Staff یا Customer) | `requireAuthenticatedUser()` |
| **Permission خاص** | RBAC — فقط نقش‌های دارای آن Permission | `requireApiUser(PERMISSIONS.X)` |

---

## ۱. Social Links

| Method | Path | دسترسی |
|---|---|---|
| GET | `/api/v1/social-links` | عمومی |
| PATCH | `/api/v1/social-links` | `SETTINGS_MANAGE` |

`GET` پاسخ:
```json
{ "links": [{ "platform": "instagram", "url": "https://...", "isActive": true }, ...] }
```

`PATCH` بدنه: دقیقاً ۵ آیتم (`instagram`, `telegram`, `whatsapp`,
`rubika`, `eitaa`) — هر کدام `{platform, url, isActive}`. اگر
`isActive: true` باشد، `url` نباید خالی باشد.

پلتفرم‌های پشتیبانی‌شده در `SOCIAL_PLATFORMS`
(`src/models/SocialLinks.ts`) تعریف شده‌اند؛ افزودن مورد جدید فقط یک
خط است.

---

## ۲. استان‌ها و شهرها

| Method | Path | دسترسی |
|---|---|---|
| GET | `/api/v1/provinces` | عمومی |
| GET | `/api/v1/cities?province={provinceId}` | عمومی |
| POST | `/api/v1/provinces/import` | `LOCATIONS_MANAGE` (multipart Excel) |

`GET /provinces` پاسخ:
```json
[{ "id": "...", "name": "تهران", "code": "TEH" }, ...]
```

`GET /cities?province=` همان شکل، فیلترشده روی استان.

`POST /provinces/import`: فایل Excel با ستون‌های `Province`,
`Province Code`, `City`, `City Code`. سعی می‌کند به‌صورت
Transactional اجرا شود (روی MongoDB Atlas؛ روی یک Mongo Standalone
محلی Fallback غیر-Transactional می‌شود). پاسخ شامل تعداد
Upsert‌شده‌ها + فهرست سطرهای رد‌شده با شماره سطر واقعی Excel است.

---

## ۳. نقشه نشان (Neshan)

بدون API اختصاصی Backend — این یک تصمیم معماری + Environment
Variable است، نه یک Endpoint:

- `NEXT_PUBLIC_NESHAN_API_KEY` — Client-side، چون ویجت نقشه
  (`@neshan-maps-platform/leaflet`) ذاتاً در مرورگر Tile می‌گیرد.
  امنیت آن با محدودیت Domain/Referrer در پنل Neshan تأمین می‌شود.
- Reverse Geocoding مستقیماً از Client به
  `https://api.neshan.org/v5/reverse?lat=..&lng=..` با هدر `Api-Key`
  فراخوانی می‌شود (`src/components/maps/neshan-map-picker.tsx`).

**قبل از Production، Domain واقعی سایت باید در پنل Neshan به‌عنوان
Referrer مجاز ثبت شود.**

---

## ۴. آدرس (Order Shipping Address)

هیچ Model مستقل `Address` ساخته نشد (تصمیم مستند در CLAUDE.md).
`Order.shippingAddress` دو فیلد اختیاری اضافه کرد:

```ts
{
  recipientName, phoneNumber, province, city, addressLine, postalCode,
  latitude?: number,   // از Map Picker
  longitude?: number,
}
```

استان/شهر همچنان رشته (نام) ذخیره می‌شوند، اما در UI فقط از طریق
`ProvinceCitySelect` (Dropdown دو-مرحله‌ای مبتنی بر بخش ۲) قابل
انتخاب‌اند — هیچ Input آزاد متنی وجود ندارد.

⚠️ **محدودیت شناخته‌شده:** چون این فیلدها نام هستند نه ID، سمت سرور
تضمین نمی‌شود که «شهر واقعاً متعلق به همان استان» است — این کنترل
فقط در UI است.

---

## ۵. APIهای عمومی محصولات Storefront

همه بدون Auth، فقط محصولات `published`/حذف‌نشده، همه `?page=&limit=`
دارند (`limit` حداکثر ۵۰، پیش‌فرض ۱۲):

| Method | Path | معیار |
|---|---|---|
| GET | `/api/v1/products/latest` | `sort: createdAt desc` |
| GET | `/api/v1/products/best-discounts` | بیشترین درصد تخفیف مؤثر (Variant، محاسبه در Application) |
| GET | `/api/v1/products/best-selling` | مجموع `quantity` در Orderهای غیر `cancelled`/`returned` (Aggregation واقعی) |
| GET | `/api/v1/products/amazing-offers` | شگفت‌انگیزهای زنده (`isActive` + بازه زمانی) |

شکل هر آیتم محصول (از `buildPublicProductSummary`):
```json
{
  "id", "title", "slug",
  "category": { "id", "name", "slug" } | null,
  "coverImage": "url" | null,
  "minPrice": 1000000,
  "originalPrice": 1200000,
  "maxDiscountPercent": 17,
  "totalStock": 42,
  "createdAt": "..."
}
```

`amazing-offers` هر آیتم را در `{ offerId, product, variantId,
discountType, discountValue, offerPrice, startAt, endAt }` می‌پیچد.
`best-selling` یک فیلد اضافه `totalSold` دارد.

پاسخ همه شامل `pagination: { totalDocs, totalPages, page, limit,
hasNextPage, hasPrevPage }` است.

---

## ۶. Cart

همه با `requireAuthenticatedUser()` (هر کاربر Login‌شده، نقش مهم
نیست):

| Method | Path | کار |
|---|---|---|
| GET | `/api/v1/cart` | دریافت (با بازمحاسبه کامل) |
| POST | `/api/v1/cart/items` | افزودن `{productId, variantId, quantity}` |
| PATCH | `/api/v1/cart/items/:itemId` | تغییر تعداد `{quantity}` |
| DELETE | `/api/v1/cart/items/:itemId` | حذف یک قلم |
| DELETE | `/api/v1/cart` | خالی‌کردن کامل |
| POST | `/api/v1/cart/validate` | بازمحاسبه صریح (برای قبل از Checkout) |
| POST | `/api/v1/cart/coupon` | اعمال کد تخفیف `{code}` |
| DELETE | `/api/v1/cart/coupon` | حذف کد تخفیف اعمال‌شده |

پاسخ استاندارد Cart:
```json
{
  "id", "items": [{
    "id", "product": {"id","title","slug","image"}, "variantId",
    "quantity", "unit", "unitPrice", "discountPercent", "discountAmount",
    "finalUnitPrice", "itemTotal", "isAvailable", "unavailableReason"
  }],
  "cartTotal": 3000000,
  "appliedCoupon": { "code": "WELCOME10", "discountPercentage": 10 } | null,
  "discountAmount": 300000,
  "grandTotal": 2700000,
  "itemCount": 3,
  "updatedAt": "..."
}
```

### قوانین کلیدی (پیاده‌سازی‌شده)
- **قیمت هرگز از Client نمی‌آید** — همیشه از `recomputeCartItem` روی
  آخرین وضعیت زنده Variant محاسبه می‌شود، در هر GET/POST/PATCH/DELETE.
- **بین تخفیف عادی Variant و شگفت‌انگیز زنده، بیشترین تخفیف انتخاب
  می‌شود** (هرگز جمع نمی‌شوند).
- **کد تخفیف** روی `cartTotal` (بعد از تخفیف Variant/شگفت‌انگیز)
  اعمال می‌شود؛ اگر Itemها عوض شوند و دیگر واجد شرایط نباشد، خودش پاک
  می‌شود. اعمال کد تخفیف روی Cart هرگز `usedCount`/`CouponRedemption`
  را تغییر نمی‌دهد — فقط ثبت سفارش واقعی این کار را می‌کند.
- **بدون Inventory Reservation** — موجودی فقط لحظه Add/Update چک
  می‌شود.
- **Cart هنوز به فرآیند واقعی Checkout وصل نیست.**

---

## ۷. Wallet — کامل (واریز، برداشت، پرداخت ترکیبی)

بدون درگاه پرداخت اختصاصی برای تعدیل دستی — اما **واریز از طریق
زرین‌پال** و **برداشت به کارت/شبا (صف بررسی دستی)** کامل شدند.

### تعدیل دستی (ادمین)
| Method | Path | دسترسی |
|---|---|---|
| GET | `/api/v1/wallet` | هر کاربر Login‌شده (کیف پول خودش) |
| GET | `/api/v1/wallets/:userId` | `WALLET_READ` (Staff+) |
| POST | `/api/v1/wallets/:userId/adjust` | `WALLET_MANAGE` (فقط Admin) |

### واریز (Top-up از طریق زرین‌پال)
| Method | Path | دسترسی |
|---|---|---|
| POST | `/api/v1/wallet/topup` | هر کاربر Login‌شده — بدنه `{amount}` (حداقل ۱۰,۰۰۰ تومان)، پاسخ شامل `paymentUrl` |
| GET | `/api/v1/wallet/topup/callback` | عمومی (Redirect زرین‌پال) → `/wallet/topup/result` |

### درخواست برداشت (تسویه به کارت/شبا)
| Method | Path | دسترسی |
|---|---|---|
| POST | `/api/v1/wallet/withdrawals` | هر کاربر — بدنه `{amount, ownerName, cardNumber?, iban?}` (حداقل ۱۶ رقمی کارت یا `IR`+۲۴رقم شبا، حداقل یکی الزامی) |
| GET | `/api/v1/wallet/withdrawals` | خود کاربر — فهرست درخواست‌های خودش |
| GET | `/api/v1/wallets/withdrawals?status=` | `WALLET_MANAGE` — صف بررسی همه کاربران |
| POST | `/api/v1/wallets/withdrawals/:id/review` | `WALLET_MANAGE` — بدنه `{action: "approve"|"reject", note?}` |

⚠️ هیچ API واقعی Payout خودکار وصل نیست — تأیید یعنی ادمین از قبل
واریز واقعی (کارت‌به‌کارت/پایا/ساتنا) را خارج از سیستم انجام داده و
فقط نتیجه را ثبت می‌کند. مبلغ از **لحظه ثبت درخواست** (نه لحظه تأیید)
Atomic کسر می‌شود؛ رد کردن آن را برمی‌گرداند.

### پرداخت ترکیبی (Wallet + زرین‌پال) روی سفارش‌ها
`POST /api/v1/payments/initiate` حالا `useWallet: boolean` (اختیاری)
می‌پذیرد. اگر `true`: تا سقف موجودی واقعی مشتری از مبلغ باقی‌مانده
سفارش کسر می‌شود؛ اگر کل مبلغ را پوشش دهد اصلاً نیازی به زرین‌پال
نیست (`paidFromWallet: true` در پاسخ)؛ در غیر این صورت فقط باقیمانده
واقعی به درگاه فرستاده می‌شود. `Payment.walletAmount` سهم کیف پول را
جدا از `Payment.amount` (سهم درگاه) نگه می‌دارد.

**نکته صحت مالی:** اگر بعد از کسر سهم کیف پول، تلاش درگاه شکست
بخورد/لغو شود، `payments/callback` خودکار همان سهم را به کیف پول
برمی‌گرداند.

پاسخ `GET /wallet` و `GET /wallets/:userId`:
```json
{
  "balance": 500000,
  "transactions": [{
    "id", "type": "credit", "amount": 100000, "balanceAfter": 500000,
    "reason": "...", "createdAt": "..."
  }]
}
```

---

## ۸. Checkout واقعی (Cart → Order)

| Method | Path | دسترسی |
|---|---|---|
| POST | `/api/v1/checkout` | هر کاربر Login‌شده (خودش صاحب سفارش است) |

بدنه:
```json
{
  "shippingAddress": { "recipientName", "phoneNumber", "province", "city", "addressLine", "postalCode", "latitude?", "longitude?" },
  "paymentMethod": "online" | "cash" | "split",
  "prepaymentPercent": 50,
  "shippingCost": 50000,
  "useWallet": true,
  "notes": ""
}
```

رفتار:
1. Cart کاربر بازمحاسبه می‌شود (دقیقاً مثل `POST /api/v1/cart/validate`)؛ اگر خالی باشد یا Itemی `isAvailable: false` داشته باشد، رد می‌شود.
2. Itemهای Cart با همان منطق مشترک `createOrder()` (که Dashboard هم استفاده می‌کند) به سفارش واقعی تبدیل می‌شوند — بازمحاسبه قیمت از DB، رزرو Atomic کد تخفیف، کسر موجودی. کد تخفیف اعمال‌شده روی Cart مستقیماً پاس داده می‌شود.
3. Cart بعد از موفقیت کامل خالی می‌شود.
4. اگر `paymentMethod !== "cash"`: بلافاصله `initiateOrderPayment()` با همان `useWallet` صدا زده می‌شود (پرداخت ترکیبی).
5. اگر ایجاد سفارش موفق ولی شروع پرداخت ناموفق بود: پاسخ ۲۰۱ با `payment: null` و `paymentError` — سفارش از دست نمی‌رود، بعداً می‌توان از `POST /api/v1/payments/initiate` دوباره تلاش کرد.

پاسخ موفق:
```json
{
  "order": { "id", "orderNumber", "totalAmount" },
  "payment": {
    "paymentId", "paymentUrl": "https://...|null",
    "amount": 500000, "walletAmount": 200000,
    "paidFromWallet": false, "reused": false
  }
}
```

⚠️ بدون موتور محاسبه خودکار هزینه ارسال — `shippingCost` مستقیماً از Client گرفته می‌شود.

---

## Environment Variables جدید این سند

به `.env.example` مراجعه کنید. خلاصه:

| متغیر | توضیح |
|---|---|
| `NEXT_PUBLIC_NESHAN_API_KEY` | Client-side، برای نقشه + Reverse Geocoding نشان |

هیچ Environment Variable دیگری در Phase 2 تا 8 اضافه نشد (Social
Links/Province-City/Cart/Wallet همه فقط از `MONGODB_URI` موجود
استفاده می‌کنند).
