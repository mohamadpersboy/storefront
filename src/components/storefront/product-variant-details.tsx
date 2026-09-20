import { getVariantDetailSegments } from "@/lib/storefront/product-purchase-math";

type ProductVariantDetailsProps = {
  colorName: string | null;
  colorHex: string | null;
  attributes: { name: string; value: string }[];
};

/**
 * خط ریز مشخصات Variant انتخاب‌شده — زیر Pillهای انتخاب واحد فروش،
 * بالای Stepper تعداد (طبق درخواست صریح کارفرما). رنگ (اگر ثبت شده
 * باشد) اول است: یک دایره کوچک هم‌رنگ + نام رنگ. بعدش هر ویژگی فنی
 * مختص همین Variant، هم‌زمان با عنوان و مقدار («عرض: ۲ متر»). همه با
 * «-» از هم جدا می‌شوند. اگر نه رنگی ثبت شده نه هیچ ویژگی‌ای،
 * چیزی رندر نمی‌شود (نه یک خط خالی).
 */
export function ProductVariantDetails({
  colorName,
  colorHex,
  attributes,
}: ProductVariantDetailsProps) {
  const segments = getVariantDetailSegments({ colorName, colorHex, attributes });

  if (segments.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-gray-600">
      {segments.map((segment, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-300">-</span>}
          {segment.type === "color" ? (
            <span className="flex items-center gap-1.5">
              <span
                className="h-3 w-3 shrink-0 rounded-full border border-black/10"
                style={{ backgroundColor: segment.hex ?? "#d4d4d8" }}
                aria-hidden="true"
              />
              <span className="font-medium text-[var(--sf-ink)]">رنگ: {segment.name}</span>
            </span>
          ) : (
            <span>
              <span className="font-medium text-[var(--sf-ink)]">{segment.name}</span>
              {": "}
              {segment.value}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
