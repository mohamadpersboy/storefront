import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CheckForm } from "@/components/checks/check-form";

export default function NewCheckPage() {
  return (
    <div className="flex flex-col gap-4">
      <Link
        href="/dashboard/checks"
        className="flex w-fit items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ChevronRight className="size-4" />
        بازگشت به چک‌ها
      </Link>
      <div>
        <h1 className="text-lg font-semibold text-foreground">ثبت چک دریافتی</h1>
      </div>
      <CheckForm />
    </div>
  );
}
