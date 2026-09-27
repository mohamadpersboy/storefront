import { HelpCircle } from "lucide-react";
import { connectToDatabase } from "@/lib/db/connect";
import { Faq } from "@/models/Faq";
import { PageHeader } from "@/components/storefront/page-header";
import { EmptyState } from "@/components/storefront/empty-state";
import { FaqAccordion } from "@/components/storefront/faq-accordion";

export const revalidate = 60;

type FaqRow = { id: string; question: string; answer: string };

async function getActiveFaqsSafe(): Promise<FaqRow[]> {
  try {
    await connectToDatabase();
    const faqs = await Faq.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();
    return faqs.map((f) => ({
      id: String(f._id),
      question: f.question,
      answer: f.answer,
    }));
  } catch {
    // اگر DB در دسترس نبود، صفحه نباید خراب شود — همان Empty State
    // «هنوز سوالی ثبت نشده» نمایش داده می‌شود (هم‌الگو با
    // `getActiveBanners()` در صفحه اصلی).
    return [];
  }
}

/**
 * صفحه «سوالات متداول» — مصرف‌کننده مستقیم مدل `Faq` (بدون Round-trip
 * به `GET /api/v1/faqs`، همان الگوی بقیه صفحات اصلی Storefront).
 *
 * فیلتر `isActive: true` این‌جا اعمال می‌شود، نه در خود مدل/API —
 * دقیقاً طبق کامنت روی `GET /api/v1/faqs`: «فیلتر کردن به سوالات
 * فعال وظیفه مصرف‌کننده (Storefront) است؛ Dashboard برای مدیریت به
 * همه نیاز دارد.»
 */
export default async function FaqPage() {
  const faqs = await getActiveFaqsSafe();

  return (
    <div>
      <PageHeader title="سوالات متداول" />

      <div className="px-4 py-4 sm:mx-auto sm:max-w-2xl sm:px-6">
        {faqs.length === 0 ? (
          <EmptyState
            icon={HelpCircle}
            title="هنوز سوالی ثبت نشده"
            description="به‌زودی پرتکرارترین سوالات مشتریان را این‌جا پاسخ می‌دهیم."
            actionLabel="بازگشت به صفحه اصلی"
            actionHref="/"
          />
        ) : (
          <FaqAccordion items={faqs} />
        )}
      </div>
    </div>
  );
}
