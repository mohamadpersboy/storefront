import Image from "next/image";
import { Info } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { getAboutUs } from "@/models/AboutUs";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";

// طبق همان تجربه بنرها/دسته‌بندی‌های صفحه اصلی: بدون این، Next.js این
// صفحه را کاملاً Static می‌سازد و تغییرات Dashboard → تنظیمات →
// درباره ما تا Deploy بعدی دیده نمی‌شوند.
export const revalidate = 60;

/**
 * صفحه «درباره ما» — مصرف‌کننده مستقیم `getAboutUs()` (همان مدل و
 * الگوی `AboutUsCard` در صفحه اصلی: Server Component، بدون یک HTTP
 * Round-trip اضافه به `GET /api/v1/about-us`، چون همین Server از
 * قبل به دیتابیس وصل است).
 *
 * برخلاف `AboutUsCard` (که فقط خلاصه سه‌خطی نشان می‌دهد و «بیشتر
 * بدانید» به همین مسیر لینک می‌کند)، این‌جا متن کامل نمایش داده
 * می‌شود؛ `imageUrl` هم اگر ثبت شده باشد به‌صورت یک تصویر Cover
 * بالای متن می‌آید (فیلدی که در کارت خلاصه اصلاً استفاده نمی‌شد).
 *
 * اگر ادمین هنوز محتوایی ثبت نکرده باشد (`content` خالی، مقدار
 * پیش‌فرض مدل)، یک Empty State صادقانه نشان داده می‌شود، نه یک
 * صفحه سفید یا متن Placeholder ساختگی.
 */
async function getAboutUsSafe(): Promise<{ title: string; content: string; imageUrl: string }> {
  try {
    await connectToDatabase();
    const doc = await getAboutUs();
    return { title: doc.title, content: doc.content, imageUrl: doc.imageUrl };
  } catch {
    // اگر DB در دسترس نبود، صفحه نباید خراب شود — همان Empty State
    // «هنوز محتوایی ثبت نشده» نمایش داده می‌شود (هم‌الگو با
    // `getActiveBanners()` در صفحه اصلی).
    return { title: "", content: "", imageUrl: "" };
  }
}

export default async function AboutPage() {
  const doc = await getAboutUsSafe();

  const hasContent = doc.content.trim().length > 0;

  return (
    <div>
      <PageHeader title="درباره ما" />

      {!hasContent ? (
        <EmptyState
          icon={Info}
          title="هنوز محتوایی ثبت نشده"
          description="به‌زودی درباره فروشگاه اینترنتی فرش سقطچی بیشتر می‌نویسیم."
          actionLabel="بازگشت به صفحه اصلی"
          actionHref="/"
        />
      ) : (
        <div className="px-4 py-4 sm:mx-auto sm:max-w-2xl sm:px-6">
          {doc.imageUrl ? (
            <div className="relative mb-4 aspect-[16/9] w-full overflow-hidden rounded-2xl">
              <Image
                src={doc.imageUrl}
                alt={doc.title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 672px"
              />
            </div>
          ) : null}

          <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
            <h1 className="text-base font-bold text-[var(--sf-ink)] sm:text-lg">
              {doc.title}
            </h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
              {doc.content}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
