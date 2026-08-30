import { SocialLinksForm } from "@/components/settings/social-links-form";

export default function SocialLinksPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-semibold text-foreground">شبکه‌های اجتماعی</h1>
        <p className="mt-1 text-sm text-muted">
          مدیریت لینک‌های اینستاگرام، تلگرام، واتساپ، روبیکا و ایتا برای نمایش در فوتر فروشگاه
        </p>
      </div>
      <SocialLinksForm />
    </div>
  );
}
