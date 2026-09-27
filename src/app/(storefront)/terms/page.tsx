import { FileText } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { getTerms } from "@/models/Terms";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";

export const revalidate = 60;

async function getTermsSafe(): Promise<{ title: string; content: string }> {
  try {
    await connectToDatabase();
    const doc = await getTerms();
    return { title: doc.title, content: doc.content };
  } catch {
    // اگر DB در دسترس نبود، صفحه نباید خراب شود — همان Empty State
    // «هنوز محتوایی ثبت نشده» نمایش داده می‌شود (هم‌الگو با
    // `getActiveBanners()` در صفحه اصلی).
    return { title: "", content: "" };
  }
}

/**
 * صفحه «قوانین و مقررات» — مصرف‌کننده مستقیم `getTerms()` (بدون
 * Round-trip به `GET /api/v1/terms`، همان الگوی `/about`/`/faq`).
 * مدل/API/فرم Dashboard این بخش هم در همین Task از صفر ساخته شد
 * (برخلاف درباره ما/تماس با ما/سوالات متداول که Backend‌شان از قبل
 * آماده بود)، چون قبل از این هیچ محل ذخیره‌ای برای متن قوانین و
 * مقررات در پروژه وجود نداشت.
 */
export default async function TermsPage() {
  const doc = await getTermsSafe();
  const hasContent = doc.content.trim().length > 0;

  return (
    <div>
      <PageHeader title="قوانین و مقررات" />

      {!hasContent ? (
        <EmptyState
          icon={FileText}
          title="هنوز محتوایی ثبت نشده"
          description="به‌زودی قوانین و مقررات فروشگاه این‌جا نمایش داده می‌شود."
          actionLabel="بازگشت به صفحه اصلی"
          actionHref="/"
        />
      ) : (
        <div className="px-4 py-4 sm:mx-auto sm:max-w-2xl sm:px-6">
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
