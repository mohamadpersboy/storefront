import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * لینک کوتاه دعوت (`/r/CODE`) که در صفحهٔ «دعوت دوستان» به اشتراک
 * گذاشته می‌شود. این خودش صفحه نیست — فقط یک Redirect است:
 *
 * - اگر بازدیدکننده از قبل Login است، دعوت برایش معنا ندارد (فقط
 *   کاربر *جدید* می‌تواند دعوت‌شده باشد) → مستقیم به صفحه اصلی.
 * - در غیر این صورت → به `/login?ref=CODE&redirect=/` تا کد رفرال
 *   از طریق فرم OTP موجود به `POST /api/v1/auth/otp/verify` برسد
 *   (نگاه کنید `OtpLoginForm`) — بدون هیچ صفحهٔ ثبت‌نام جداگانه‌ای،
 *   چون این پروژه اصلاً چنین صفحه‌ای ندارد (ورود همیشه با OTP روی
 *   شماره موبایل است).
 */
export default async function InviteRedirectPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const user = await getCurrentUser();

  if (user) {
    redirect("/");
  }

  redirect(`/login?ref=${encodeURIComponent(code)}&redirect=${encodeURIComponent("/")}`);
}
