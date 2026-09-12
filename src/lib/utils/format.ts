const faDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (d) => faDigits[Number(d)]);
}

/**
 * Converts Persian (۰-۹) and Arabic-Indic (٠-٩) digits to plain ASCII
 * digits. Many phones/OSes type Persian digits directly from a
 * numeric keyboard, so any numeric `<input>` must normalize before
 * stripping non-digit characters — otherwise every digit already
 * shown on screen (rendered in Persian via `toPersianDigits`) looks
 * like a non-digit character and gets wiped on the next keystroke.
 */
export function toEnglishDigits(input: string): string {
  return input.replace(/[۰-۹٠-٩]/g, (d) => {
    const faIndex = faDigits.indexOf(d);
    if (faIndex !== -1) return String(faIndex);
    return String(arabicIndicDigits.indexOf(d));
  });
}

/** Strips everything except digits, after normalizing Persian/Arabic-Indic digits to ASCII. */
export function digitsOnly(value: string): string {
  return toEnglishDigits(value).replace(/[^0-9]/g, "");
}

const tomanFormatter = new Intl.NumberFormat("fa-IR");

/** Formats an integer amount (in Toman) with Persian digit grouping. */
export function formatToman(amount: number): string {
  return `${tomanFormatter.format(amount)} تومان`;
}

/**
 * فونت IRANYekanX Pro یک گلیف اختصاصی برای نماد «تومان» دارد که با
 * قانون Ligature داخل خود فونت (Feature `rlig` — که همیشه در مرورگر
 * فعال است و برخلاف `liga` قابل خاموش‌کردن نیست) فعال می‌شود: وقتی
 * متن دقیقاً کلمه «تومان» و بلافاصله بعدش نویسه «ء» (Arabic Letter
 * Hamza، U+0621) بیاید، فونت این دنباله را با یک گلیف واحد (نماد
 * تومان) جایگزین می‌کند. این با بررسی مستقیم جدول GSUB فایل فونت
 * تأیید شده — نویسه «ء» نباید در جای دیگری از پروژه (مثلاً
 * `formatToman` بالا که کلمه معمولی «تومان» را نشان می‌دهد) استفاده
 * شود، فقط همین‌جا.
 */
const TOMAN_GLYPH_SUFFIX = "\u0621";

/** مثل `formatToman` ولی به‌جای کلمه «تومان»، گلیف اختصاصی فونت را نمایش می‌دهد. */
export function formatTomanGlyph(amount: number): string {
  return `${tomanFormatter.format(amount)} تومان${TOMAN_GLYPH_SUFFIX}`;
}

export function formatNumber(value: number): string {
  return tomanFormatter.format(value);
}

export function formatPercent(value: number): string {
  return `${toPersianDigits(value)}٪`;
}

/**
 * Formats a person for display as "نام (شماره تلفن)" — always showing
 * both, instead of silently hiding the phone number whenever a name
 * is present.
 */
export function formatPersonWithPhone(
  fullName: string | null | undefined,
  phoneNumber: string,
): string {
  const phone = toPersianDigits(phoneNumber);
  return fullName ? `${fullName} (${phone})` : phone;
}
