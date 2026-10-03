/**
 * نگاشت خالص خطای ثبت/حذف نظر به پیام فارسی. پیام خام Backend نمایش
 * داده نمی‌شود (متن ثابت و قابل‌پیش‌بینی). `refresh` یعنی وضعیت سرور
 * با Client هم‌خوان نیست و باید `router.refresh()` اجرا شود.
 */
export type ReviewFormError = { message: string; refresh: boolean };

export const REVIEW_SUBMIT_SUCCESS_MESSAGE =
  "نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.";
export const REVIEW_PENDING_MESSAGE = "نظر شما در انتظار بررسی است.";
export const REVIEW_REJECTED_MESSAGE = "نظر شما تأیید نشد.";
export const REVIEW_GUEST_MESSAGE = "برای ثبت نظر ابتدا وارد حساب کاربری شوید.";
export const REVIEW_UNAVAILABLE_MESSAGE =
  "ثبت نظر برای این محصول امکان‌پذیر نیست.";
export const REVIEW_BUYERS_ONLY_MESSAGE =
  "ثبت نظر فقط برای خریداران این محصول امکان‌پذیر است.";
export const REVIEW_DELETE_CONFIRM_MESSAGE = "آیا از حذف نظر خود مطمئن هستید؟";

export function mapReviewSubmitError(status: number): ReviewFormError {
  switch (status) {
    case 401:
      return {
        message: "برای ثبت نظر ابتدا وارد حساب کاربری شوید.",
        refresh: true,
      };
    case 403:
      return { message: REVIEW_BUYERS_ONLY_MESSAGE, refresh: true };
    case 404:
      return { message: REVIEW_UNAVAILABLE_MESSAGE, refresh: true };
    case 409:
      return {
        message: "شما قبلاً برای این محصول نظر ثبت کرده‌اید.",
        refresh: true,
      };
    case 422:
      return {
        message: "اطلاعات نظر معتبر نیست. موارد را بررسی کنید.",
        refresh: false,
      };
    default:
      return {
        message: "ثبت نظر انجام نشد. دوباره تلاش کنید.",
        refresh: false,
      };
  }
}

export function mapReviewDeleteError(status: number): ReviewFormError {
  switch (status) {
    case 401:
      return {
        message: "برای حذف نظر ابتدا وارد حساب کاربری شوید.",
        refresh: true,
      };
    case 404:
      return { message: "این نظر دیگر وجود ندارد.", refresh: true };
    default:
      return {
        message: "حذف نظر انجام نشد. دوباره تلاش کنید.",
        refresh: false,
      };
  }
}

export function mapReviewImageUploadError(status: number | null): string {
  if (status === 401) return "برای آپلود تصویر ابتدا وارد حساب کاربری شوید.";
  if (status === 403)
    return "آپلود تصویر فقط برای خریداران این محصول امکان‌پذیر است.";
  return "آپلود تصویر انجام نشد. دوباره تلاش کنید.";
}
