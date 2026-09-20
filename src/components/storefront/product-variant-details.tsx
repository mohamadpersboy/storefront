import { getVariantDetailSegments } from "@/lib/storefront/product-purchase-math";

type ProductVariantDetailsProps = {
  colorName: string | null;
  colorHex: string | null;
  attributes: { name: string; value: string }[];
};

/**
 * خط ریز مشخصات Variant انتخاب‌شده — زیر Pillهای انتخاب واحد فروش،
 * بالای Stepper تعداد (طبق درخواست صریح کارفرما). رنگ (اگر ثبت شده
 * باشد) اول است، به‌ترتیب: «رنگ:» ← دایره هم‌رنگ ← نام رنگ (دایره
 * *بعد* از «:» می‌آید، نه قبل از کلمه «رنگ» — طبق اصلاح صریح
 * کارفرما). دور دایره یک رینگ سفید کشیده شده تا رنگ‌های روشن هم
 * روی بک‌گراند سفید/خاکستری روشن صفحه دیده شوند. بعدش هر ویژگی فنی
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
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 text-xs text-gray-600">
      {segments.map((segment, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-gray-300">-</span>}
          {segment.type === "color" ? (
            <span className="flex items-center gap-1.5">
              <span className="font-medium text-[var(--sf-ink)]">رنگ:</span>
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-white ring-1 ring-black/10"
                style={{ backgroundColor: segment.hex ?? "#d4d4d8" }}
                aria-hidden="true"
              />
              <span className="font-medium text-[var(--sf-ink)]">{segment.name}</span>
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
