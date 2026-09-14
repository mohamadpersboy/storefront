import { connectToDatabase } from "@/lib/db/connect";
import { requireAuthenticatedUser } from "@/lib/auth/api-guard";
import { apiError, apiSuccess } from "@/lib/utils/api-response";
import { createAddressSchema } from "@/lib/validations/addresses";
import { Address, type AddressType } from "@/models/Address";

function serializeAddress(address: {
  _id: unknown;
  addressType: AddressType;
  customTitle: string | null;
  recipientName: string;
  phoneNumber: string;
  province: string;
  city: string;
  addressLine: string;
  postalCode: string;
  latitude?: number;
  longitude?: number;
  isDefault: boolean;
  createdAt: Date;
}) {
  return {
    id: String(address._id),
    addressType: address.addressType,
    customTitle: address.customTitle,
    recipientName: address.recipientName,
    phoneNumber: address.phoneNumber,
    province: address.province,
    city: address.city,
    addressLine: address.addressLine,
    postalCode: address.postalCode,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    isDefault: address.isDefault,
    createdAt: address.createdAt,
  };
}

/**
 * دفترچه آدرس خود کاربر — بدون Permission خاص، دقیقاً هم‌الگو با
 * Cart/Wallet (`requireAuthenticatedUser`؛ هر کاربر فقط آدرس‌های
 * خودش را می‌بیند/می‌سازد).
 */
export async function GET() {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  await connectToDatabase();

  const addresses = await Address.find({ user: guard.user.id })
    .sort({ isDefault: -1, createdAt: -1 })
    .lean();

  return apiSuccess(addresses.map(serializeAddress));
}

export async function POST(request: Request) {
  const guard = await requireAuthenticatedUser();
  if (guard.response) return guard.response;

  const json = await request.json().catch(() => null);
  const parsed = createAddressSchema.safeParse(json);
  if (!parsed.success) {
    return apiError("اطلاعات ارسالی معتبر نیست", {
      status: 422,
      errors: parsed.error.flatten().fieldErrors,
    });
  }

  await connectToDatabase();

  const existingCount = await Address.countDocuments({ user: guard.user.id });
  // اولین آدرس کاربر همیشه پیش‌فرض است — کاربر نباید مجبور شود
  // برای اولین آدرسش جداگانه «تعیین به‌عنوان پیش‌فرض» بزند.
  const isDefault = existingCount === 0 ? true : Boolean(parsed.data.isDefault);

  if (isDefault) {
    await Address.updateMany({ user: guard.user.id }, { $set: { isDefault: false } });
  }

  const address = await Address.create({
    user: guard.user.id,
    addressType: parsed.data.addressType,
    customTitle: parsed.data.addressType === "other" ? parsed.data.customTitle?.trim() : null,
    recipientName: parsed.data.recipientName,
    phoneNumber: parsed.data.phoneNumber,
    province: parsed.data.province,
    city: parsed.data.city,
    addressLine: parsed.data.addressLine,
    postalCode: parsed.data.postalCode,
    latitude: parsed.data.latitude,
    longitude: parsed.data.longitude,
    isDefault,
  });

  return apiSuccess(serializeAddress(address), {
    status: 201,
    message: "آدرس با موفقیت ثبت شد",
  });
}
