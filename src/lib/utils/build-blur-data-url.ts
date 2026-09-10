/**
 * از یک تصویر Cloudinary آپلودشده یک نسخه خیلی کوچک و کاملاً تار
 * می‌سازد (با Transformation آنی Cloudinary: عرض ۲۴px + Blur شدید +
 * کیفیت خیلی پایین)، آن را Fetch کرده و به Base64 Data URL تبدیل
 * می‌کند. این مقدار به‌عنوان Placeholder محو (Mesh Blur) واقعیِ
 * رنگ‌های همان تصویر — نه یک Placeholder خاکستری Generic — با
 * `placeholder="blur"` خود Next.js Image استفاده می‌شود (طبق بند
 * ۲۷-۳۰ Master Workflow).
 *
 * ابتدا برای Banner ساخته شد، حالا مشترک است تا هر بخش دیگری (مثل
 * تصویر دسته‌بندی) که نیاز به همین رفتار دارد، آن را Duplicate نکند.
 */
export async function buildBlurDataUrl(secureUrl: string): Promise<string | null> {
  try {
    const blurredUrl = secureUrl.replace(
      "/upload/",
      "/upload/w_24,e_blur:1000,q_1,f_jpg/",
    );
    const res = await fetch(blurredUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("blur read failed"));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
