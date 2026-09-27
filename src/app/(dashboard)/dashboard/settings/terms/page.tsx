import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { TermsForm } from "@/components/settings/terms-form";

export default function TermsSettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/settings"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به تنظیمات
      </Link>
      <TermsForm />
    </div>
  );
}
