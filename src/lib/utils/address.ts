import type { AddressType } from "@/models/Address";

/**
 * برچسب فارسی هر نوع آدرس — «خانه»/«محل کار» همیشه از همین‌جا
 * ساخته می‌شوند (نه از Database) تا اگر فردا متن دقیق تغییر کرد،
 * فقط یک‌جا اصلاح شود. برای `"other"` برچسب واقعی همان `customTitle`
 * ذخیره‌شده در Database است.
 */
export const ADDRESS_TYPE_LABELS: Record<AddressType, string> = {
  home: "خانه",
  work: "محل کار",
  other: "سایر",
};

export function getAddressDisplayTitle(address: {
  addressType: AddressType;
  customTitle?: string | null;
}): string {
  if (address.addressType === "other") {
    return address.customTitle?.trim() || ADDRESS_TYPE_LABELS.other;
  }
  return ADDRESS_TYPE_LABELS[address.addressType];
}
